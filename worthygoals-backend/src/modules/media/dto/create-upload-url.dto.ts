import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Photos are resized to ≤1280px JPEG on the device; 10 MB is generous. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export class CreateUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^image\/(jpeg|png|webp|gif|heic|heif)$/, {
    message: 'contentType must be an image MIME type',
  })
  contentType!: string;

  // Signed into the URL as Content-Length, so storage rejects any body of a
  // different size. The URL used to carry no size at all — a storage-cost
  // DoS, since anyone with a token could upload arbitrarily large objects.
  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES)
  byteSize!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  height?: number;
}
