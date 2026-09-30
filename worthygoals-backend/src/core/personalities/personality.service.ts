import { Injectable, NotFoundException } from '@nestjs/common';
import { PersonalityLoader } from './personality.loader';
import { PersonalitySchema } from './personality.schema';

@Injectable()
export class PersonalityService {
  constructor(private readonly loader: PersonalityLoader) {}

  renderSystemPrompt(
    personalityId: string,
    event: string,
    context: Record<string, unknown> = {},
  ): string {
    const personality = this.loader.get(personalityId);
    if (!personality) {
      throw new NotFoundException(`Personality "${personalityId}" not found`);
    }

    const eventDef = personality.events[event] ?? personality.events['default'];

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

  hasPersonality(id: string): boolean {
    return this.loader.has(id);
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
