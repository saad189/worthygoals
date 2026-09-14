// Catalog shape only. The server excludes promptBlocks and the
// topic/safety/memory/model policies from every mentor response, so they are
// deliberately absent here — the app never rendered them.
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
