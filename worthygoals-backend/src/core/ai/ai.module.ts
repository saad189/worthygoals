import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mentor } from 'src/database/models';
import { Conversation } from 'src/database/models/conversation.entity';
import { Message } from 'src/database/models/message.entity';
import { ConversationSummary } from 'src/database/models/conversation-summary.entity';
import { AiCall } from 'src/database/models/ai-call.entity';
import { User } from 'src/database/models/user.entity';
import { AiService } from './ai.service';
import { AgentService } from './agent.service';
import { OpenAiProvider } from './gateway/openai.provider';
import { AnthropicProvider } from './gateway/anthropic.provider';
import { AiGatewayService } from './gateway/ai-gateway.service';
import { QuotaService } from './quota/quota.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Mentor,
      Conversation,
      Message,
      ConversationSummary,
      AiCall,
      User,
    ]),
  ],
  providers: [
    AiService,
    OpenAiProvider,
    AnthropicProvider,
    QuotaService,
    AiGatewayService,
    AgentService,
  ],
  exports: [AiService, AiGatewayService, AgentService],
})
export class AiModule {}
