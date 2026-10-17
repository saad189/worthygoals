export interface PersonalityExample {
  user: string;
  assistant: string;
}

export interface PersonalityEvent {
  /** What to do for this event; the persona's identity is added in front. */
  instruction: string;
  examples?: PersonalityExample[];
}

/** Provider-neutral: no model id, so any provider can serve any persona. */
export interface PersonalityRouting {
  temperature?: number;
  max_tokens?: number;
}

export interface PersonalitySchema {
  id: string;
  name: string;
  description: string;
  /** Identity and always-on rules, sent ahead of every event instruction. */
  persona: string;
  events: Record<string, PersonalityEvent>;
  routing: PersonalityRouting;
}

export const REQUIRED_EVENTS = [
  'default',
  'task.completed',
  'task.failed.couldnt',
  'task.failed.forgot',
  'task.failed.chose_not_to',
];
