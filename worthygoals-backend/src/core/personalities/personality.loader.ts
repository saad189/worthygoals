import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  PersonalitySchema,
  REQUIRED_EVENTS,
} from './personality.schema';

@Injectable()
export class PersonalityLoader implements OnModuleInit {
  private readonly logger = new Logger(PersonalityLoader.name);
  private readonly personalities = new Map<string, PersonalitySchema>();

  private get dataDir(): string {
    return path.join(__dirname, 'data');
  }

  onModuleInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    const files = fs
      .readdirSync(this.dataDir)
      .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

    if (files.length === 0) {
      throw new Error('PersonalityLoader: no personality YAML files found in data/');
    }

    for (const file of files) {
      const filePath = path.join(this.dataDir, file);
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = yaml.load(raw) as PersonalitySchema;
      this.validate(parsed, file);
      this.personalities.set(parsed.id, parsed);
      this.logger.log(`Loaded personality: ${parsed.id} (${parsed.name})`);
    }
  }

  private validate(p: PersonalitySchema, file: string): void {
    const ctx = `[${file}]`;
    if (!p.id) throw new Error(`${ctx} missing required field: id`);
    if (!p.name) throw new Error(`${ctx} missing required field: name`);
    if (!p.voice) throw new Error(`${ctx} missing required field: voice`);
    if (!p.voice.tone) throw new Error(`${ctx} voice.tone is required`);
    if (!Array.isArray(p.voice.vocabulary)) throw new Error(`${ctx} voice.vocabulary must be an array`);
    if (!p.events) throw new Error(`${ctx} missing required field: events`);
    if (!p.routing) throw new Error(`${ctx} missing required field: routing`);

    for (const event of REQUIRED_EVENTS) {
      if (!p.events[event]) {
        throw new Error(`${ctx} personality "${p.id}" missing required event: ${event}`);
      }
      if (!p.events[event].system_prompt) {
        throw new Error(`${ctx} event "${event}" missing system_prompt`);
      }
    }
  }

  get(id: string): PersonalitySchema | undefined {
    return this.personalities.get(id);
  }

  getAll(): PersonalitySchema[] {
    return Array.from(this.personalities.values());
  }

  has(id: string): boolean {
    return this.personalities.has(id);
  }
}
