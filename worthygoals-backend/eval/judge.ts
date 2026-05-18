import OpenAI from 'openai';

export interface JudgeInput {
  openai: OpenAI;
  personalityName: string;
  voiceTone: string;
  reference: string;
  actual: string;
  userMessage: string;
}

export interface JudgeResult {
  tone: number;
  continuity: number;
  reason: string;
}

export async function judgeOutput(input: JudgeInput): Promise<JudgeResult> {
  const prompt = `You are evaluating an AI mentor's response for tone fidelity and factual continuity.

Personality: ${input.personalityName} (voice tone: ${input.voiceTone})
User said: "${input.userMessage}"
Reference (golden) response: "${input.reference}"
Actual response: "${input.actual}"

Score the actual response on two dimensions (0–10 each):
1. tone: Does it sound like ${input.personalityName}? Does it match the expected ${input.voiceTone} voice?
2. continuity: Does it correctly address what the user said? Is it relevant and coherent?

Reply ONLY as a JSON object with no other text:
{"tone": <0-10>, "continuity": <0-10>, "reason": "<one short sentence explaining the lowest score>"}`;

  const resp = await input.openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    max_tokens: 120,
    response_format: { type: 'json_object' },
  });

  const raw = resp.choices[0]?.message?.content ?? '{}';
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { tone: 5, continuity: 5, reason: 'judge parse error' };
  }

  return {
    tone: clamp(Number(parsed.tone ?? 5)),
    continuity: clamp(Number(parsed.continuity ?? 5)),
    reason: String(parsed.reason ?? ''),
  };
}

function clamp(n: number): number {
  if (isNaN(n)) return 5;
  return Math.min(10, Math.max(0, n));
}
