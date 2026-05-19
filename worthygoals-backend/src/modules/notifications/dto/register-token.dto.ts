import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PushPlatform } from 'src/database/models/push-token.entity';

export class RegisterTokenDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  @IsString()
  @MaxLength(512)
  token: string;

  @ApiPropertyOptional({ enum: ['expo', 'fcm', 'apns'], default: 'expo' })
  @IsOptional()
  @IsIn(['expo', 'fcm', 'apns'])
  platform?: PushPlatform;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
