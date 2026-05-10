import { PartialType } from '@nestjs/mapped-types';
import { CreateConversationDto } from './create-conversation.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ConversationStatus } from 'src/common/constants';

export class UpdateConversationDto extends PartialType(CreateConversationDto) {
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;
}
