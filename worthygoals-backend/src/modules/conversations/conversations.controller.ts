import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Conversation } from 'src/database/models/conversation.entity';

@Controller('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('mentorId') mentorId?: string,
    @Query('include') include?: string | string[],
  ): Promise<Conversation[]> {
    return this.conversationsService.findAll({
      sub: req.user.sub,
      mentorId: mentorId ? Number(mentorId) : undefined,
      include,
    });
  }

  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id') id: string,
    @Query('include') include?: string | string[],
  ): Promise<Conversation> {
    return this.conversationsService.findOne({
      id,
      sub: req.user.sub,
      include,
    });
  }

  @Post()
  async create(
    @Request() req,
    @Body() createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    return this.conversationsService.create({
      sub: req.user.sub,
      dto: createConversationDto,
    });
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ): Promise<Conversation> {
    return this.conversationsService.update({
      id,
      sub: req.user.sub,
      dto: updateConversationDto,
    });
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string): Promise<void> {
    return this.conversationsService.remove({
      id,
      sub: req.user.sub,
    });
  }
}
