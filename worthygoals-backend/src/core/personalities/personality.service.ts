import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PersonalityLoader } from './personality.loader';
import { PersonalityRouting, PersonalitySchema } from './personality.schema';

@Injectable()
export class PersonalityService {
  private readonly logger = new Logger(PersonalityService.name);

  constructor(private readonly loader: PersonalityLoader) {}

  /**
   * persona + event instruction + the event's examples, as one system prompt.
   *
   * Examples ride in the system prompt rather than as fake user/assistant
   * turns: on the chat path, fabricated turns would read as things the user
   * actually said earlier in the conversation. Same text on every provider.
   */
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

    const parts = [
      personality.persona.trim(),
      this.interpolate(
        eventDef.instruction,
        context,
        `${personalityId}/${event}`,
      ).trim(),
    ];

    if (eventDef.examples?.length) {
      const shots = eventDef.examples
        .map((e) => `User: ${e.user}\nYou: ${e.assistant}`)
        .join('\n\n');
      parts.push(
        `Examples of your voice (match the register, never repeat them verbatim):\n\n${shots}`,
      );
    }

    return parts.join('\n\n');
  }

  getRoutingConfig(personalityId: string): PersonalityRouting {
    return this.loader.get(personalityId)?.routing ?? {};
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
    where: string,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const val = context[key];
      if (val === undefined || val === null || val === '') {
        // Still renders (a push must not fail over copy), but loudly: an empty
        // {{streak}} shipped "Streak:  days." to the model unnoticed.
        this.logger.warn(`${where}: no value for {{${key}}}`);
        return '';
      }
      return String(val);
    });
  }
}
