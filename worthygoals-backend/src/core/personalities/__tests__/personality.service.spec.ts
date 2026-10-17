import { NotFoundException } from '@nestjs/common';
import { PersonalityService } from '../personality.service';
import { PersonalityLoader } from '../personality.loader';
import { PersonalitySchema } from '../personality.schema';

function buildMockPersonality(id: string): PersonalitySchema {
  return {
    id,
    name: `${id} Name`,
    description: 'Test personality',
    persona: `You are ${id}.`,
    events: {
      default: {
        instruction: 'Default prompt for {{context}}.',
      },
      'task.completed': {
        instruction: 'Completed {{goalName}} with streak {{streak}}.',
        examples: [{ user: 'Done.', assistant: 'Next.' }],
      },
      'task.failed.couldnt': { instruction: 'Couldnt prompt.' },
      'task.failed.forgot': { instruction: 'Forgot prompt.' },
      'task.failed.chose_not_to': { instruction: 'Chose not to prompt.' },
    },
    routing: {
      temperature: 0.7,
      max_tokens: 150,
    },
  };
}

function buildLoader(personalities: PersonalitySchema[]): PersonalityLoader {
  const loader = new PersonalityLoader();
  // bypass onModuleInit filesystem loading by seeding directly
  const map = (loader as any).personalities as Map<string, PersonalitySchema>;
  for (const p of personalities) map.set(p.id, p);
  return loader;
}

function buildService(personalities: PersonalitySchema[]): PersonalityService {
  const loader = buildLoader(personalities);
  return new PersonalityService(loader);
}

describe('PersonalityService', () => {
  describe('renderSystemPrompt', () => {
    it('composes persona, event instruction and examples, in that order', () => {
      const svc = buildService([buildMockPersonality('marcus')]);
      const result = svc.renderSystemPrompt('marcus', 'task.completed', {
        goalName: 'Morning Run',
        streak: '7',
      });
      expect(result).toBe(
        'You are marcus.\n\n' +
          'Completed Morning Run with streak 7.\n\n' +
          'Examples of your voice (match the register, never repeat them verbatim):\n\n' +
          'User: Done.\nYou: Next.',
      );
    });

    it('falls back to default event when the requested event is missing', () => {
      const svc = buildService([buildMockPersonality('lyra')]);
      const result = svc.renderSystemPrompt('lyra', 'unknown.event', {
        context: 'some ctx',
      });
      expect(result).toBe('You are lyra.\n\nDefault prompt for some ctx.');
    });

    it('interpolates context variables into the prompt', () => {
      const svc = buildService([buildMockPersonality('goggs')]);
      const result = svc.renderSystemPrompt('goggs', 'default', {
        context: 'test-context-value',
      });
      expect(result).toContain('test-context-value');
    });

    it('renders unmatched placeholders empty and warns about each', () => {
      const svc = buildService([buildMockPersonality('marcus')]);
      const warn = jest
        .spyOn((svc as any).logger, 'warn')
        .mockImplementation(() => undefined);
      const result = svc.renderSystemPrompt('marcus', 'task.completed', {
        streak: '',
      });
      expect(result).toContain('Completed  with streak .');
      expect(warn).toHaveBeenCalledWith(
        'marcus/task.completed: no value for {{goalName}}',
      );
      expect(warn).toHaveBeenCalledWith(
        'marcus/task.completed: no value for {{streak}}',
      );
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
      expect(routing).toEqual({ temperature: 0.7, max_tokens: 150 });
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
