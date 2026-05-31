import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from 'src/database/models/conversation.entity';
import { Message } from 'src/database/models/message.entity';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { MessagesService } from './messages.service';
import { UsersModule } from 'src/modules/users/users.module';
import { AiModule } from 'src/core/ai';
import { MemoryModule } from 'src/core/memory/memory.module';
import { SafetyModule } from 'src/core/safety/safety.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Conversation]),
    UsersModule,
    AiModule,
    MemoryModule,
    SafetyModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService],
})
export class MessagesModule {}
