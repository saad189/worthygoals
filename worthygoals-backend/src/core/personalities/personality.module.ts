import { Module } from '@nestjs/common';
import { PersonalityLoader } from './personality.loader';
import { PersonalityService } from './personality.service';

@Module({
  providers: [PersonalityLoader, PersonalityService],
  exports: [PersonalityService],
})
export class PersonalityModule {}
