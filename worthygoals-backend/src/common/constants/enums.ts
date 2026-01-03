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
  LONG_TERM = 'long_term',
}
