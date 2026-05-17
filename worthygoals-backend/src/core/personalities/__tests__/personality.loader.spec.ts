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

  it('each personality has a voice with tone and vocabulary', () => {
    const loader = new PersonalityLoader();
    loader.onModuleInit();

    for (const p of loader.getAll()) {
      expect(p.voice.tone).toBeTruthy();
      expect(Array.isArray(p.voice.vocabulary)).toBe(true);
      expect(p.voice.vocabulary.length).toBeGreaterThan(0);
    }
  });

  it('throws on boot if a YAML file has a missing required event', () => {
    const loader = new PersonalityLoader();
    const badYaml = `
id: bad
name: Bad
description: Missing events
voice:
  tone: blunt
  vocabulary: [a]
  escalation_curve: firm
events:
  default:
    system_prompt: "ok"
routing:
  preferred_model: gpt-4o-mini
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
