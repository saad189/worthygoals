import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { PersonalitySchema, REQUIRED_EVENTS } from './personality.schema';

@Injectable()
export class PersonalityLoader implements OnModuleInit {
  private readonly logger = new Logger(PersonalityLoader.name);
  private readonly personalities = new Map<string, PersonalitySchema>();

  private get dataDir(): string {
    const distPath = path.join(__dirname, 'data');
    if (fs.existsSync(distPath)) return distPath;
    return path.join(process.cwd(), 'src', 'core', 'personalities', 'data');
  }

  onModuleInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    const files = fs
      .readdirSync(this.dataDir)
      .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

    if (files.length === 0) {
      throw new Error(
        'PersonalityLoader: no personality YAML files found in data/',
      );
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
    if (!p.persona) throw new Error(`${ctx} missing required field: persona`);
    if (!p.events) throw new Error(`${ctx} missing required field: events`);
    if (!p.routing) throw new Error(`${ctx} missing required field: routing`);

    for (const event of REQUIRED_EVENTS) {
      if (!p.events[event]) {
        throw new Error(
          `${ctx} personality "${p.id}" missing required event: ${event}`,
        );
      }
    }

    // Every event, not just the required ones: a leftover `system_prompt`
    // from the old format would otherwise render as an empty instruction.
    for (const [name, def] of Object.entries(p.events)) {
      if (!def?.instruction) {
        throw new Error(`${ctx} event "${name}" missing instruction`);
      }
      const examples = def.examples ?? [];
      if (
        !Array.isArray(examples) ||
        examples.some((e) => !e?.user || !e?.assistant)
      ) {
        throw new Error(
          `${ctx} event "${name}" examples must be {user, assistant} pairs`,
        );
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
