import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusPost, StatusReaction } from 'src/database/models';
import { CoreModule } from 'src/core';
import { MediaModule } from '../media/media.module';
import { UsersModule } from '../users/users.module';
import { StatusController } from './status.controller';
import { StatusService } from './status.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StatusPost, StatusReaction]),
    // CoreModule re-exports AiModule → AiGatewayService (persona injection).
    CoreModule,
    UsersModule,
    // Presigned GET urls for attached status photos (screen 12's photo chip).
    MediaModule,
  ],
  controllers: [StatusController],
  providers: [StatusService],
})
export class StatusModule {}
