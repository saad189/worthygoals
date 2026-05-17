export interface PersonalityVoice {
  tone: string;
  vocabulary: string[];
  escalation_curve: 'gentle' | 'firm' | 'sharp';
}

export interface PersonalityEvent {
  system_prompt: string;
  examples?: Array<{ user: string; assistant: string }>;
}

export interface PersonalityRouting {
  preferred_model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface PersonalitySchema {
  id: string;
  name: string;
  description: string;
  voice: PersonalityVoice;
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
