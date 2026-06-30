import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Goal } from 'src/database/models';
import { CoreModule } from 'src/core';
import { UsersModule } from '../users/users.module';
import { WeeklyReviewController } from './weekly-review.controller';
import { WeeklyReviewService } from './weekly-review.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Goal]),
    // CoreModule re-exports AiModule → AiGatewayService (persona injection).
    CoreModule,
    UsersModule,
  ],
  controllers: [WeeklyReviewController],
  providers: [WeeklyReviewService],
})
export class WeeklyReviewModule {}
