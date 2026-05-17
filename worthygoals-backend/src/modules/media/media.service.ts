import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { Media } from './media.entity';

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
    this.bucket = config.get<string>('S3_BUCKET_NAME', '');
    const accessKeyId = config.get<string>('S3_ACCESS_KEY_ID', '');
    const secretAccessKey = config.get<string>('S3_SECRET_ACCESS_KEY', '');

    if (!this.bucket || !accessKeyId || !secretAccessKey) {
      this.logger.warn('S3 credentials not configured — media upload disabled');
      this.s3 = null;
      return;
    }

    const endpoint = config.get<string>('S3_ENDPOINT');
    this.s3 = new S3Client({
      region: config.get<string>('S3_REGION', 'auto'),
      ...(endpoint ? { endpoint } : {}),
      credentials: { accessKeyId, secretAccessKey },
    });
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

    const ext = dto.fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
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

  async markAttached(mediaId: string, sub: string): Promise<void> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) return;
    await this.mediaRepo.update({ id: mediaId, userId: user.id }, { isAttached: true });
  }
}
