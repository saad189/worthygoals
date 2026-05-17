import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Personality } from 'src/database/models/personality.entity';
import { UserPersonality } from 'src/database/models/user-personality.entity';
import { PersonalityLoader } from './personality.loader';
import { PersonalityService } from './personality.service';

@Module({
  imports: [TypeOrmModule.forFeature([Personality, UserPersonality])],
  providers: [PersonalityLoader, PersonalityService],
  exports: [PersonalityService],
})
export class PersonalityModule {}
