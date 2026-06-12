import OpenAI from 'openai';

export interface JudgeInput {
  openai: OpenAI;
  personalityName: string;
  voiceTone: string;
  personalityDescription?: string;
  vocabulary?: string[];
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
  const personaLine = input.personalityDescription
    ? `Persona: ${input.personalityDescription}`
    : '';
  const vocabLine = input.vocabulary?.length
    ? `Vocabulary register: ${input.vocabulary.join(', ')}`
    : '';

  const prompt = `You are evaluating an AI mentor's response for tone fidelity and factual continuity.

Personality: ${input.personalityName} (voice tone: ${input.voiceTone})
${personaLine}
${vocabLine}
User said: "${input.userMessage}"
Reference (golden) response: "${input.reference}"
Actual response: "${input.actual}"

The reference response is the canonical sample of this persona's register — judge
tone by comparing the actual response's register against the reference, not
against your own idea of how a mentor should sound.

Score the actual response on two dimensions (0–10 each):
1. tone — register fidelity to the persona:
   9–10: same register as the reference; could have been written by the same voice
   7–8:  clearly the same persona; minor word-choice deviations
   5–6:  persona is diluted; generic-assistant phrasing leaks through
   3–4:  mostly generic assistant with a trace of the persona
   0–2:  wrong persona entirely
2. continuity — does it correctly address what the user said; relevant and coherent:
   use the same 0–10 anchoring.

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
