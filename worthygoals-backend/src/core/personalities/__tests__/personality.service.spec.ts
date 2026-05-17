import { NotFoundException } from '@nestjs/common';
import { PersonalityService } from '../personality.service';
import { PersonalityLoader } from '../personality.loader';
import { PersonalitySchema } from '../personality.schema';

function buildMockPersonality(id: string): PersonalitySchema {
  return {
    id,
    name: `${id} Name`,
    description: 'Test personality',
    voice: { tone: 'test', vocabulary: ['a'], escalation_curve: 'firm' },
    events: {
      default: {
        system_prompt: 'Default prompt for {{context}}.',
      },
      'task.completed': {
        system_prompt: 'Completed {{goalName}} with streak {{streak}}.',
      },
      'task.failed.couldnt': { system_prompt: 'Couldnt prompt.' },
      'task.failed.forgot': { system_prompt: 'Forgot prompt.' },
      'task.failed.chose_not_to': { system_prompt: 'Chose not to prompt.' },
    },
    routing: { preferred_model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 150 },
  };
}

function buildLoader(personalities: PersonalitySchema[]): PersonalityLoader {
  const loader = new PersonalityLoader();
  // bypass onModuleInit filesystem loading by seeding directly
  const map = (loader as any).personalities as Map<string, PersonalitySchema>;
  for (const p of personalities) map.set(p.id, p);
  return loader;
}

function buildService(
  personalities: PersonalitySchema[],
): PersonalityService {
  const loader = buildLoader(personalities);
  const personalityRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() } as any;
  const userPersonalityRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() } as any;
  return new PersonalityService(loader, personalityRepo, userPersonalityRepo);
}

describe('PersonalityService', () => {
  describe('renderSystemPrompt', () => {
    it('renders the correct event prompt for a known personality and event', () => {
      const svc = buildService([buildMockPersonality('marcus')]);
      const result = svc.renderSystemPrompt('marcus', 'task.completed', {
        goalName: 'Morning Run',
        streak: '7',
      });
      expect(result).toBe('Completed Morning Run with streak 7.');
    });

    it('falls back to default event when the requested event is missing', () => {
      const svc = buildService([buildMockPersonality('lyra')]);
      const result = svc.renderSystemPrompt('lyra', 'unknown.event', {
        context: 'some ctx',
      });
      expect(result).toBe('Default prompt for some ctx.');
    });

    it('interpolates context variables into the prompt', () => {
      const svc = buildService([buildMockPersonality('goggs')]);
      const result = svc.renderSystemPrompt('goggs', 'default', {
        context: 'test-context-value',
      });
      expect(result).toContain('test-context-value');
    });

    it('leaves unmatched placeholders as empty strings', () => {
      const svc = buildService([buildMockPersonality('marcus')]);
      const result = svc.renderSystemPrompt('marcus', 'task.completed', {});
      expect(result).toBe('Completed  with streak .');
    });

    it('throws NotFoundException for an unknown personality', () => {
      const svc = buildService([]);
      expect(() =>
        svc.renderSystemPrompt('unknown', 'task.completed', {}),
      ).toThrow(NotFoundException);
    });
  });

  describe('getRoutingConfig', () => {
    it('returns routing config for a known personality', () => {
      const svc = buildService([buildMockPersonality('marcus')]);
      const routing = svc.getRoutingConfig('marcus');
      expect(routing.preferred_model).toBe('gpt-4o-mini');
      expect(routing.temperature).toBe(0.7);
    });

    it('returns empty object for an unknown personality', () => {
      const svc = buildService([]);
      expect(svc.getRoutingConfig('nobody')).toEqual({});
    });
  });

  describe('listAll', () => {
    it('returns all loaded personalities', () => {
      const personalities = [
        buildMockPersonality('marcus'),
        buildMockPersonality('lyra'),
        buildMockPersonality('goggs'),
      ];
      const svc = buildService(personalities);
      expect(svc.listAll()).toHaveLength(3);
    });
  });
});
