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

  personalityTraits?: any;
  promptBlocks?: any;
  topicPolicy?: Record<string, any>;
  safetyPolicy?: Record<string, any>;
  memoryPolicy?: Record<string, any>;

  isActive?: boolean;
  visibility?: string;

  isPremium?: boolean;
  requiredPlan?: string;

  version?: number;
  avgRating?: number;
  totalSessions?: number;

  tags?: any[];

  createdAt?: string;
  updatedAt?: string;
}
