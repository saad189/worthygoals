export type BoardItemType = 'win' | 'milestone';
export type MilestoneKind = 'streak_7' | 'streak_30' | 'goal_completed';

export interface BoardItem {
  id: string;
  type: BoardItemType;
  // win cards
  taskTitle?: string;
  goalTitle?: string;
  goalCategory?: string;
  moodScore?: number;
  reflection?: string;
  mentorReaction?: string;
  /** Pre-signed GET URL for the memory photo */
  mediaUrl?: string;
  // milestone cards
  milestoneKind?: MilestoneKind;
  streakDays?: number;
  createdAt: string;
}
