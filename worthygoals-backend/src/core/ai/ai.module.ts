import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mentor } from 'src/database/models';
import { Conversation } from 'src/database/models/conversation.entity';
import { Message } from 'src/database/models/message.entity';
import { ConversationSummary } from 'src/database/models/conversation-summary.entity';
import { AiService } from './ai.service';
import { AgentService } from './agent.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Mentor,
      Conversation,
      Message,
      ConversationSummary,
    ]),
  ],
  providers: [AiService, AgentService],
  exports: [AiService, AgentService],
})
export class AiModule {}
