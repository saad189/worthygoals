import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendTextMessageDto {
  @IsUUID()
  conversationId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  clientMessageId?: string;
}
