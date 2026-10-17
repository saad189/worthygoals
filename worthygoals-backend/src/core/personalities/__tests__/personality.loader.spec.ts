import * as fs from 'fs';
import { PersonalityLoader } from '../personality.loader';

describe('PersonalityLoader', () => {
  it('loads all three seed personalities from YAML files without error', () => {
    const loader = new PersonalityLoader();
    loader.onModuleInit();

    expect(loader.has('marcus')).toBe(true);
    expect(loader.has('lyra')).toBe(true);
    expect(loader.has('goggs')).toBe(true);
  });

  it('loaded personalities have required events', () => {
    const loader = new PersonalityLoader();
    loader.onModuleInit();

    for (const p of loader.getAll()) {
      expect(p.events['default']).toBeDefined();
      expect(p.events['task.completed']).toBeDefined();
      expect(p.events['task.failed.couldnt']).toBeDefined();
      expect(p.events['task.failed.forgot']).toBeDefined();
      expect(p.events['task.failed.chose_not_to']).toBeDefined();
    }
  });

  it('each personality has a persona, and no model id in routing', () => {
    const loader = new PersonalityLoader();
    loader.onModuleInit();

    for (const p of loader.getAll()) {
      expect(p.persona).toBeTruthy();
      // A provider-specific id here is sent to whichever provider is active.
      expect(Object.keys(p.routing)).not.toContain('preferred_model');
    }
  });

  it('throws on boot if an event still uses the old system_prompt key', () => {
    const loader = new PersonalityLoader();
    const legacy = (event: string) => `  ${event}:\n    instruction: "ok"\n`;
    const badYaml = `
id: bad
name: Bad
persona: "You are Bad."
events:
${['default', 'task.completed', 'task.failed.couldnt', 'task.failed.forgot', 'task.failed.chose_not_to'].map(legacy).join('')}  status.reaction:
    system_prompt: "old format"
routing: {}
`;
    const readSpy = jest
      .spyOn(fs, 'readdirSync')
      .mockReturnValue(['bad.yaml'] as any);
    const readFileSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(badYaml);

    expect(() => loader.onModuleInit()).toThrow(
      /event "status.reaction" missing instruction/,
    );

    readSpy.mockRestore();
    readFileSpy.mockRestore();
  });

  it('throws on boot if a YAML file has a missing required event', () => {
    const loader = new PersonalityLoader();
    const badYaml = `
id: bad
name: Bad
description: Missing events
persona: "You are Bad."
events:
  default:
    instruction: "ok"
routing: {}
`;
    const readSpy = jest
      .spyOn(fs, 'readdirSync')
      .mockReturnValue(['bad.yaml'] as any);
    const readFileSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(badYaml);

    expect(() => loader.onModuleInit()).toThrow(/missing required event/);

    readSpy.mockRestore();
    readFileSpy.mockRestore();
  });

  it('throws on boot if a YAML file is missing required top-level fields', () => {
    const loader = new PersonalityLoader();
    const badYaml = `name: OnlyName`;

    const readSpy = jest
      .spyOn(fs, 'readdirSync')
      .mockReturnValue(['bad.yaml'] as any);
    const readFileSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(badYaml);

    expect(() => loader.onModuleInit()).toThrow(/missing required field/);

    readSpy.mockRestore();
    readFileSpy.mockRestore();
  });
});
