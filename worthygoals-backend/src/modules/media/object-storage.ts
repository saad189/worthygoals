import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

export interface ObjectStorage {
  s3: S3Client;
  bucket: string;
}

/**
 * The S3/R2 client for user uploads, or null when storage is not configured
 * (media upload is an optional tier). Shared by MediaService and GDPR
 * deletion, which cannot inject MediaService — MediaModule imports
 * UsersModule, so the reverse import would be circular.
 */
export function createObjectStorage(
  config: ConfigService,
): ObjectStorage | null {
  const bucket = config.get<string>('S3_BUCKET_NAME', '');
  const accessKeyId = config.get<string>('S3_ACCESS_KEY_ID', '');
  const secretAccessKey = config.get<string>('S3_SECRET_ACCESS_KEY', '');
  if (!bucket || !accessKeyId || !secretAccessKey) return null;

  const endpoint = config.get<string>('S3_ENDPOINT');
  return {
    bucket,
    s3: new S3Client({
      region: config.get<string>('S3_REGION', 'auto'),
      ...(endpoint ? { endpoint } : {}),
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}
