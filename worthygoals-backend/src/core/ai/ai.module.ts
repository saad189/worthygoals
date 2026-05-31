import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mentor } from 'src/database/models';
import { Conversation } from 'src/database/models/conversation.entity';
import { Message } from 'src/database/models/message.entity';
import { ConversationSummary } from 'src/database/models/conversation-summary.entity';
import { AiCall } from 'src/database/models/ai-call.entity';
import { DriftSample } from 'src/database/models/drift-sample.entity';
import { User } from 'src/database/models/user.entity';
import { AgentService } from './agent.service';
import { OpenAiProvider } from './gateway/openai.provider';
import { AnthropicProvider } from './gateway/anthropic.provider';
import { AiGatewayService } from './gateway/ai-gateway.service';
import { QuotaService } from './quota/quota.service';
import { PersonalityModule } from 'src/core/personalities/personality.module';
import { MemoryModule } from 'src/core/memory/memory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Mentor,
      Conversation,
      Message,
      ConversationSummary,
      AiCall,
      DriftSample,
      User,
    ]),
    PersonalityModule,
    MemoryModule,
  ],
  providers: [
    OpenAiProvider,
    AnthropicProvider,
    QuotaService,
    AiGatewayService,
    AgentService,
  ],
  exports: [AiGatewayService, AgentService],
})
export class AiModule {}
