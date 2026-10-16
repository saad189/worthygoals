import { isUUID } from 'class-validator';
import { AuthenticatedRequest } from 'src/common/interfaces';
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
import { SafetyService } from 'src/core/safety/safety.service';
import { MessagesService } from './messages.service';
import { SendTextMessageDto } from './dto/send-text-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { MessagesGateway } from './messages.gateway';

@Controller('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
    private readonly safetyService: SafetyService,
  ) {}

  @Get()
  async list(
    @Request() req: AuthenticatedRequest,
    @Query('conversationId') conversationId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
    @Query('beforeId') beforeId?: string,
  ): Promise<MessageResponseDto[]> {
    if (!conversationId) {
      throw new BadRequestException('conversationId is required');
    }
    const beforeDate = before ? new Date(before) : undefined;
    if (beforeDate && Number.isNaN(beforeDate.getTime())) {
      throw new BadRequestException('before must be an ISO timestamp');
    }
    if (beforeId && !isUUID(beforeId)) {
      throw new BadRequestException('beforeId must be a message id');
    }

    const messages = await this.messagesService.list({
      conversationId,
      sub: req.user.sub,
      limit,
      before: beforeDate,
      beforeId,
    });

    return messages.map((message) => MessageResponseDto.fromEntity(message));
  }

  @Post()
  async send(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SendTextMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messagesService.sendUserTextMessage({
      sub: req.user.sub,
      dto,
    });

    const response = MessageResponseDto.fromEntity(message);
    this.messagesGateway.emitMessageCreated(dto.conversationId, response);

    // The socket path answers a crisis message with the audited safe response;
    // this REST path saved it and said nothing at all.
    if (this.safetyService.isCrisisSignal(dto.text)) {
      const crisis = await this.messagesService.createMentorTextMessage({
        conversationId: dto.conversationId,
        text: this.safetyService.getCrisisResponse(),
        tokensIn: null,
        tokensOut: null,
      });
      this.messagesGateway.emitMessageCreated(
        dto.conversationId,
        MessageResponseDto.fromEntity(crisis),
      );
    }
    return response;
  }
}
