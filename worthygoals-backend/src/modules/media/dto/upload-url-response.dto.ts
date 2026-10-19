/** POST /media/upload-url — properties are documented by the Swagger plugin. */
export class UploadUrlResponseDto {
  /** Presigned PUT URL; the declared size and content type are signed in. */
  uploadUrl!: string;
  /** Pass this back as mediaId when attaching the photo. */
  mediaId!: string;
  s3Key!: string;
}
