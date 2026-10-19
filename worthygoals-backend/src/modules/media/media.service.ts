import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { EntityManager, In, MoreThan, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { Media } from 'src/database/models/media.entity';
import { createObjectStorage } from './object-storage';

const PRESIGNED_URL_TTL_SECONDS = 300;

/**
 * Upload URLs a user can mint in any rolling 24 hours. A real day is a
 * handful of completion and status photos; this only stops a script (or a
 * retry loop) filling the bucket on our bill.
 */
export const MAX_UPLOADS_PER_DAY = 40;

/** A draft nothing references after this long was abandoned, not pending. */
const ORPHAN_AFTER_HOURS = 24;
const SWEEP_PAGE_SIZE = 500;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly s3: S3Client | null;
  private readonly bucket: string;

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {
    const storage = createObjectStorage(config);
    if (!storage) {
      this.logger.warn('S3 credentials not configured — media upload disabled');
    }
    this.s3 = storage?.s3 ?? null;
    this.bucket = storage?.bucket ?? '';
  }

  async createUploadUrl(
    sub: string,
    dto: CreateUploadUrlDto,
  ): Promise<{ uploadUrl: string; mediaId: string; s3Key: string }> {
    if (!this.s3) {
      throw new ServiceUnavailableException('Media upload is not configured');
    }

    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');

    const recent = await this.mediaRepo.count({
      where: {
        userId: user.id,
        uploadedAt: MoreThan(new Date(Date.now() - 24 * 3_600_000)),
      },
    });
    if (recent >= MAX_UPLOADS_PER_DAY) {
      throw new HttpException(
        'Upload limit reached for today. Try again tomorrow.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const rawExt = dto.fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
    // Strip anything that could break out of the drafts/<userId>/ key prefix.
    const ext = rawExt.replace(/[^a-z0-9]/g, '') || 'jpg';
    // randomUUID, not Date.now(): two uploads in the same millisecond shared
    // a key and the second overwrote the first.
    const s3Key = `drafts/${user.id}/${randomUUID()}.${ext}`;

    const media = this.mediaRepo.create({
      userId: user.id,
      s3Key,
      contentType: dto.contentType,
      width: dto.width,
      height: dto.height,
      isAttached: false,
    });
    const saved = await this.mediaRepo.save(media);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
      ContentType: dto.contentType,
      ContentLength: dto.byteSize,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: PRESIGNED_URL_TTL_SECONDS,
      // Presigning leaves content-length unsigned unless asked; signing it is
      // what makes the size binding.
      signableHeaders: new Set(['content-type', 'content-length']),
    });

    return { uploadUrl, mediaId: saved.id, s3Key };
  }

  /**
   * Signs a GET for a media object the given user owns.
   *
   * userId is required, not optional. This previously took the mediaId alone
   * and signed whatever row it found — an hour-long URL to any user's upload
   * for anyone who could produce an id. Both call sites already query only the
   * caller's own rows, so the parameter costs them nothing; requiring it is
   * what stops the next caller reintroducing the hole. Same shape as
   * markAttached below.
   */
  async getPresignedGetUrl(
    mediaId: string,
    userId: number,
  ): Promise<string | null> {
    return (
      (await this.getPresignedGetUrls([mediaId], userId)).get(mediaId) ?? null
    );
  }

  /**
   * One query for a page of media instead of one findOne per card — the
   * board and status feed each made up to 50 on every load. Ids that aren't
   * the user's own are simply absent from the map.
   */
  async getPresignedGetUrls(
    mediaIds: string[],
    userId: number,
  ): Promise<Map<string, string>> {
    const urls = new Map<string, string>();
    const s3 = this.s3;
    if (!s3 || !mediaIds.length) return urls;
    const rows = await this.mediaRepo.find({
      select: { id: true, s3Key: true },
      where: { id: In([...new Set(mediaIds)]), userId },
    });
    await Promise.all(
      rows.map(async (m) => {
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: m.s3Key,
        });
        urls.set(
          m.id,
          await getSignedUrl(s3, command, {
            expiresIn: PRESIGNED_URL_TTL_SECONDS,
          }),
        );
      }),
    );
    return urls;
  }

  /**
   * Mark a draft attached. Throws when the id is not the caller's own media:
   * the update used to match zero rows and return silently, after the post
   * carrying someone else's media id had already been saved. Pass the
   * EntityManager of an open transaction to roll that post back with it.
   */
  async markAttached(
    mediaId: string,
    sub: string,
    em?: EntityManager,
  ): Promise<void> {
    const user = await this.usersService.findByAccountSub(sub);
    const repo = em ? em.getRepository(Media) : this.mediaRepo;
    const res = user
      ? await repo.update(
          { id: mediaId, userId: user.id },
          { isAttached: true },
        )
      : undefined;
    if (!res?.affected) throw new NotFoundException('Media not found');
  }

  /**
   * Delete uploads nothing ever used: a presigned URL minted for a photo the
   * user then didn't post, or a completion abandoned mid-sheet. Without this
   * every such draft was stored and billed forever.
   *
   * "Used" is read from the references themselves, not just isAttached:
   * completion photos (task_completions.memoryPictureId) never set the flag,
   * so trusting it alone would delete the board's memory pictures. Objects go
   * before rows, so a failed S3 call leaves the row to retry next run instead
   * of an object nothing points to.
   */
  async sweepOrphans(now = new Date()): Promise<number> {
    const s3 = this.s3;
    if (!s3) return 0;
    const cutoff = new Date(now.getTime() - ORPHAN_AFTER_HOURS * 3_600_000);
    let swept = 0;

    for (;;) {
      const orphans: Array<{ id: string; s3Key: string }> =
        await this.mediaRepo.query(
          `
          SELECT m.id, m."s3Key"
            FROM media m
           WHERE m."isAttached" = false
             AND m."uploadedAt" < $1
             AND NOT EXISTS (SELECT 1 FROM status_posts s
                              WHERE s."mediaId" = m.id)
             AND NOT EXISTS (SELECT 1 FROM task_completions c
                              WHERE c."memoryPictureId" = m.id::text)
           LIMIT $2
          `,
          [cutoff, SWEEP_PAGE_SIZE],
        );
      if (!orphans.length) break;

      const res = await s3.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: orphans.map((o) => ({ Key: o.s3Key })) },
        }),
      );
      // Keep the rows whose object S3 refused to delete; they're retried.
      const failed = new Set((res.Errors ?? []).map((e) => e.Key));
      const deleted = orphans.filter((o) => !failed.has(o.s3Key));
      if (deleted.length) {
        await this.mediaRepo.delete({ id: In(deleted.map((o) => o.id)) });
      }
      swept += deleted.length;
      if (failed.size) {
        this.logger.warn(`Orphan sweep: ${failed.size} object(s) not deleted`);
        break;
      }
      if (orphans.length < SWEEP_PAGE_SIZE) break;
    }
    return swept;
  }
}
