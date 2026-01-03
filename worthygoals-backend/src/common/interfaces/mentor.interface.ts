import { MemoryScope } from '../constants';

export interface Mentor {
  id: number;
  name: string;
  description: string;
  personalityStats?: any;
  imageUri: string;
}

export type PersonalityTraits = {
  patience?: number; // 0..100 or 0..1 (pick one convention)
  kindness?: number;
  clarity?: number;
  straightforwardness?: number;
  humor?: number;
  empathy?: number;
  spirituality?: number;
};

export type PromptBlocks = {
  systemPrompt: string; // core persona
  behaviorPrompt?: string; // how to respond
  safetyPrompt?: string; // boundaries
  contextPrompt?: string; // app-specific context
  // optional:
  examples?: Array<{ user: string; assistant: string }>;
};

export type TopicPolicy = {
  expertiseDomains?: string[]; // e.g. ["career", "mindfulness"]
  allowedTopics?: string[]; // optional allowlist
  restrictedTopics?: string[]; // explicit blocklist
};

export type SafetyPolicy = {
  ageRestrictions?: { minAge?: number; maxAge?: number };
  disclaimerText?: string;
  contentFilters?: {
    medicalAdvice?: boolean;
    legalAdvice?: boolean;
    selfHarm?: boolean;
    sexualContent?: boolean;
    violence?: boolean;
    religiousVerdicts?: boolean;
  };
  refusalStyle?: 'soft' | 'firm' | 'educational';
};

export type MemoryPolicy = {
  canRememberUser: boolean;
  scope: MemoryScope;
  // optional knobs:
  retentionDays?: number; // for long_term
};
