export enum EventFrequency {
  ONCE = 0,
  HOURLY = 1,
  DAILY = 2,
  WEEKLY = 3,
  MONTHLY = 4,
  YEARLY = 5,
}

export enum ScheduleType {
  DEED = 0,
  NOTIFICATION = 1,
}

export enum USER_ROLES {
  USER = 'User',
  ADMIN = 'Admin',
}

export enum MentorCommunicationStyle {
  GENTLE = 'gentle',
  ANALYTICAL = 'analytical',
  MOTIVATIONAL = 'motivational',
  DIRECT = 'direct',
  STRAIGHTFORWARD = 'straightforward',
  EMPATHETIC = 'empathetic',
  CALM = 'calm',
  ENERGETIC = 'energetic',
  CLEAR = 'clear',
}

export enum MentorResponseLength {
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG = 'long',
}

export enum MentorVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  BETA = 'beta',
}

export enum MemoryScope {
  NONE = 'none',
  SESSION = 'session',
  /**
   * Use when you want to remember user preferences for a limited time window
   * (e.g., 7–30 days) but not permanently.
   */
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
}

// src/db/entities/chat.enums.ts
export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export enum MessageRole {
  USER = 'user',
  MENTOR = 'mentor',
  SYSTEM = 'system',
  TOOL = 'tool',
}

export enum MessageContentType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  FILE = 'file',
  MIXED = 'mixed',
}

export enum SummaryType {
  ROLLING = 'rolling',
  MONTHLY = 'monthly',
  MILESTONE = 'milestone',
}

export enum AttachmentType {
  IMAGE = 'image',
  AUDIO = 'audio',
  FILE = 'file',
}

export enum StorageProvider {
  S3 = 's3',
  R2 = 'r2',
  GCS = 'gcs',
  AZURE = 'azure',
}

export enum GoalCategory {
  POWER = 'power',
  KNOWLEDGE = 'knowledge',
  SPIRITUAL = 'spiritual',
}

export enum GoalStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}
