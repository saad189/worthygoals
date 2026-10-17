import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import OpenAI from 'openai';
import { judgeOutput } from './judge';
import { PersonalityLoader } from '../src/core/personalities/personality.loader';
import { PersonalityService } from '../src/core/personalities/personality.service';

const TONE_THRESHOLD = 7.0;
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
// --personality <id>: run only one personality's golden files (cheap re-runs while tuning)
const personalityFlagIdx = process.argv.indexOf('--personality');
const PERSONALITY_FILTER =
  personalityFlagIdx !== -1 ? process.argv[personalityFlagIdx + 1] : null;

interface GoldenCase {
  id: string;
  user: string;
  reference: string;
}

interface GoldenFile {
  personality: string;
  event: string;
  context: Record<string, string>;
  cases: GoldenCase[];
}

interface FileResult {
  key: string;
  avg: number;
  failed: boolean;
}

// The production loader and renderer, so the eval scores exactly the prompt
// the app sends (persona + instruction + examples), not a re-implementation.
function loadPersonalities(): PersonalityService {
  const loader = new PersonalityLoader();
  loader.onModuleInit();
  return new PersonalityService(loader);
}

function loadGoldenFiles(): GoldenFile[] {
  const goldenDir = path.join(__dirname, 'golden');
  const files: GoldenFile[] = [];
  for (const personality of fs.readdirSync(goldenDir)) {
    const pDir = path.join(goldenDir, personality);
    if (!fs.statSync(pDir).isDirectory()) continue;
    for (const f of fs.readdirSync(pDir).filter((x) => x.endsWith('.yaml'))) {
      files.push(
        yaml.load(fs.readFileSync(path.join(pDir, f), 'utf8')) as GoldenFile,
      );
    }
  }
  return files;
}

async function run(): Promise<void> {
  const personalities = loadPersonalities();
  const byId = new Map(personalities.listAll().map((p) => [p.id, p]));
  let goldenFiles = loadGoldenFiles();
  if (PERSONALITY_FILTER) {
    goldenFiles = goldenFiles.filter(
      (f) => f.personality === PERSONALITY_FILTER,
    );
    if (!goldenFiles.length) {
      console.error(
        `[eval] No golden files for personality "${PERSONALITY_FILTER}"`,
      );
      process.exit(1);
    }
  }
  const totalCases = goldenFiles.reduce((s, f) => s + f.cases.length, 0);

  console.log(
    `\n[eval] ${goldenFiles.length} files · ${totalCases} cases · threshold=${TONE_THRESHOLD}`,
  );

  if (DRY_RUN) {
    console.log(
      '[eval] DRY RUN — validating golden files, skipping API calls\n',
    );
    let ok = true;
    for (const gf of goldenFiles) {
      if (!byId.has(gf.personality)) {
        console.error(`  [ERROR] Unknown personality: ${gf.personality}`);
        ok = false;
        continue;
      }
      const p = byId.get(gf.personality)!;
      const eventDef = p.events[gf.event] ?? p.events['default'];
      if (!eventDef) {
        console.error(
          `  [ERROR] No event "${gf.event}" in personality "${gf.personality}"`,
        );
        ok = false;
      } else {
        console.log(
          `  [OK] ${gf.personality}/${gf.event} (${gf.cases.length} cases)`,
        );
      }
    }
    if (!ok) process.exit(1);
    console.log('\n[eval] Dry run complete.');
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error(
      '[eval] OPENAI_API_KEY is required. Pass --dry-run to skip API calls.',
    );
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const results: FileResult[] = [];
  let anyFailed = false;

  for (const gf of goldenFiles) {
    const personality = byId.get(gf.personality);
    if (!personality) {
      console.error(`[eval] Unknown personality: ${gf.personality}`);
      anyFailed = true;
      continue;
    }

    const eventDef =
      personality.events[gf.event] ?? personality.events['default'];
    if (!eventDef) {
      console.error(
        `[eval] No event "${gf.event}" in personality "${gf.personality}"`,
      );
      anyFailed = true;
      continue;
    }

    const systemPrompt = personalities.renderSystemPrompt(
      gf.personality,
      gf.event,
      gf.context ?? {},
    );
    const scores: number[] = [];

    console.log(`\n[${gf.personality}/${gf.event}]`);

    for (const c of gf.cases) {
      const genResp = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: c.user },
        ],
        temperature: personality.routing.temperature ?? 0.6,
        max_tokens: personality.routing.max_tokens ?? 150,
      });
      const actual = genResp.choices[0]?.message?.content?.trim() ?? '';

      const { tone, continuity, reason } = await judgeOutput({
        openai,
        personalityName: personality.name,
        persona: personality.persona,
        reference: c.reference,
        actual,
        userMessage: c.user,
      });

      const avg = (tone + continuity) / 2;
      scores.push(avg);

      const icon = tone >= TONE_THRESHOLD ? '✓' : '✗';
      const line = `  ${icon} [${c.id}] tone=${tone} cont=${continuity}`;
      if (VERBOSE || tone < TONE_THRESHOLD) {
        console.log(line);
        console.log(`       actual:    "${actual.slice(0, 100)}"`);
        console.log(`       reference: "${c.reference.slice(0, 100)}"`);
        if (tone < TONE_THRESHOLD) console.log(`       reason:    ${reason}`);
      } else {
        console.log(line);
      }
    }

    const fileAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const fileFailed = fileAvg < TONE_THRESHOLD;
    if (fileFailed) anyFailed = true;
    results.push({
      key: `${gf.personality}/${gf.event}`,
      avg: fileAvg,
      failed: fileFailed,
    });
    console.log(
      `  → avg=${fileAvg.toFixed(2)} ${fileFailed ? '✗ FAIL' : '✓ PASS'}`,
    );
  }

  console.log('\n[eval] Summary:');
  for (const r of results) {
    console.log(
      `  ${r.failed ? '✗' : '✓'} ${r.key.padEnd(36)} ${r.avg.toFixed(2)}`,
    );
  }

  if (anyFailed) {
    console.error(
      `\n[eval] FAILED — score(s) below threshold ${TONE_THRESHOLD}`,
    );
    process.exit(1);
  }

  console.log('\n[eval] All files passed.\n');
}

run().catch((err) => {
  console.error('[eval] Fatal error:', err?.message ?? err);
  process.exit(1);
});
