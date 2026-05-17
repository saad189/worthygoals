import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonalityLoader } from './personality.loader';
import { PersonalitySchema } from './personality.schema';
import { Personality } from 'src/database/models/personality.entity';
import { UserPersonality } from 'src/database/models/user-personality.entity';

@Injectable()
export class PersonalityService {
  constructor(
    private readonly loader: PersonalityLoader,
    @InjectRepository(Personality)
    private readonly personalityRepo: Repository<Personality>,
    @InjectRepository(UserPersonality)
    private readonly userPersonalityRepo: Repository<UserPersonality>,
  ) {}

  renderSystemPrompt(
    personalityId: string,
    event: string,
    context: Record<string, unknown> = {},
  ): string {
    const personality = this.loader.get(personalityId);
    if (!personality) {
      throw new NotFoundException(`Personality "${personalityId}" not found`);
    }

    const eventDef =
      personality.events[event] ?? personality.events['default'];

    if (!eventDef) {
      throw new Error(
        `Personality "${personalityId}" has no event "${event}" and no default fallback`,
      );
    }

    return this.interpolate(eventDef.system_prompt, context);
  }

  getRoutingConfig(
    personalityId: string,
  ): Pick<
    PersonalitySchema['routing'],
    'preferred_model' | 'temperature' | 'max_tokens'
  > {
    const personality = this.loader.get(personalityId);
    if (!personality) return {};
    return personality.routing;
  }

  listAll(): PersonalitySchema[] {
    return this.loader.getAll();
  }

  async getUserPersonality(userId: number): Promise<UserPersonality | null> {
    return this.userPersonalityRepo.findOne({
      where: { userId },
      order: { activatedAt: 'DESC' },
    });
  }

  async setUserPersonality(
    userId: number,
    personalityId: string,
  ): Promise<UserPersonality> {
    if (!this.loader.has(personalityId)) {
      throw new NotFoundException(`Personality "${personalityId}" not found`);
    }

    let record = await this.userPersonalityRepo.findOne({
      where: { userId, personalityId },
    });

    if (record) {
      record.activatedAt = new Date();
    } else {
      record = this.userPersonalityRepo.create({
        userId,
        personalityId,
        relationshipState: {},
        escalationSlope: 0.0,
      });
    }

    return this.userPersonalityRepo.save(record);
  }

  private interpolate(
    template: string,
    context: Record<string, unknown>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const val = context[key];
      return val !== undefined ? String(val) : '';
    });
  }
}
