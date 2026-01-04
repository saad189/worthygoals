import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards';
import { MessagesService } from './messages.service';
import { SendTextMessageDto } from './dto/send-text-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';

@Controller('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async list(
    @Request() req,
    @Query('conversationId') conversationId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ): Promise<MessageResponseDto[]> {
    if (!conversationId) {
      throw new BadRequestException('conversationId is required');
    }

    const messages = await this.messagesService.list({
      conversationId,
      sub: req.user.sub,
      limit: limit ? Number(limit) : undefined,
      before: before ? new Date(before) : undefined,
    });

    return messages.map(MessageResponseDto.fromEntity);
  }

  @Post()
  async send(
    @Request() req,
    @Body() dto: SendTextMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messagesService.sendUserTextMessage({
      sub: req.user.sub,
      dto,
    });

    return MessageResponseDto.fromEntity(message);
  }
}
