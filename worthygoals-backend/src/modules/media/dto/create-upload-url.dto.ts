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
