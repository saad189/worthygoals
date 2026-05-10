import { MemoryScope } from '../constants';

/**
 * JSON shapes used by Mentor entity.
 *
 * These are stored as JSON columns in MySQL, so:
 * - keep them backward-compatible
 * - allow extra keys
 */

// ----------------------
// UI-facing mentor shapes
// ----------------------

/**
 * Minimal mentor type often used in clients.
 * (Your DB entity is `Mentor` in `mentor.entity.ts`.)
 */
export interface Mentor {
  id: number;
  slug: string;
  name: string;

  title?: string;
  shortDescription?: string;
  longDescription?: string;

  avatarUrl?: string;
  coverImageUrl?: string;

  language?: string;
  supportedLanguages?: string[];

  communicationStyle?: string;
  responseLength?: string;
  visibility?: string;

  isActive?: boolean;
  isPremium?: boolean;
  requiredPlan?: string;

  avgRating?: number;
  totalSessions?: number;

  sortOrder?: number;
  modelConfig?: ModelConfig;

  // future-proofing
  [key: string]: any;
}

// ----------------------
// Structured JSON fields
// ----------------------

export type PersonalityTraits = {
  // convention: 0..100
  patience?: number;
  kindness?: number;
  clarity?: number;
  straightforwardness?: number;
  humor?: number;
  empathy?: number;
  spirituality?: number;
  curiosity?: number;

  [key: string]: any;
};

export type PromptExample = { user: string; assistant: string };

export type PromptBlocks = {
  /** Core persona / identity */
  systemPrompt: string;

  /** Optional: extra instruction blocks (keep for backward compatibility) */
  behaviorPrompt?: string;
  safetyPrompt?: string;
  contextPrompt?: string;

  /** Preferred response style (e.g. "Use bullets. Be warm.") */
  style?: string;

  /** Positive/negative constraints */
  do?: string[];
  dont?: string[];

  /** Few-shot examples */
  examples?: PromptExample[];

  /** Optional per-mentor overrides (if you later persist them) */
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;

  [key: string]: any;
};

export type ModelConfig = {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;

  [key: string]: any;
};

/**
 * What topics this mentor can cover, plus simple allow/deny controls.
 *
 * Note: Your seed data uses boolean maps (Record<string, boolean>). We keep both styles.
 */
export type TopicPolicy = {
  expertiseDomains?: string[];

  // array form
  allowedTopics?: string[];
  restrictedTopics?: string[];

  // map form
  allowedTopicsMap?: Record<string, boolean>;
  disallowedTopicsMap?: Record<string, boolean>;

  [key: string]: any;
};

export type SafetyPolicy = {
  ageRestrictions?: { minAge?: number; maxAge?: number };
  disclaimerText?: string;

  // old style
  contentFilters?: {
    medicalAdvice?: boolean;
    legalAdvice?: boolean;
    selfHarm?: boolean;
    sexualContent?: boolean;
    violence?: boolean;
    religiousVerdicts?: boolean;
  };

  // new style (matches seeder)
  sensitiveTopics?: {
    selfHarm?: boolean;
    sexualContent?: boolean;
    violence?: boolean;
    religiousVerdicts?: boolean;
    [key: string]: any;
  };

  refusalStyle?: 'soft' | 'firm' | 'educational';

  [key: string]: any;
};

export type MemoryPolicy = {
  canRememberUser: boolean;
  scope: MemoryScope;

  // optional knobs
  retentionDays?: number;
  maxMemories?: number;

  [key: string]: any;
};
