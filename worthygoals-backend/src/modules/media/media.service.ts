import {
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
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EntityManager, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { Media } from 'src/database/models/media.entity';
import { createObjectStorage } from './object-storage';

const PRESIGNED_URL_TTL_SECONDS = 300;

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
    if (!user) throw new ServiceUnavailableException('User not found');

    const rawExt = dto.fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
    // Strip anything that could break out of the drafts/<userId>/ key prefix.
    const ext = rawExt.replace(/[^a-z0-9]/g, '') || 'jpg';
    const s3Key = `drafts/${user.id}/${Date.now()}.${ext}`;

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
    });
    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: PRESIGNED_URL_TTL_SECONDS,
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
    if (!this.s3) return null;
    const media = await this.mediaRepo.findOne({
      where: { id: mediaId, userId },
    });
    if (!media) return null;
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: media.s3Key,
    });
    return getSignedUrl(this.s3, command, {
      expiresIn: PRESIGNED_URL_TTL_SECONDS,
    });
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
}
