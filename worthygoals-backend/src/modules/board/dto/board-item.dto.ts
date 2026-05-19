import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BoardItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['win', 'milestone'] })
  type!: 'win' | 'milestone';

  @ApiPropertyOptional()
  taskTitle?: string;

  @ApiPropertyOptional()
  goalTitle?: string;

  @ApiPropertyOptional()
  goalCategory?: string;

  /** 1–4: 😣 😐 🙂 🔥 */
  @ApiPropertyOptional()
  moodScore?: number;

  @ApiPropertyOptional()
  reflection?: string;

  @ApiPropertyOptional()
  mentorReaction?: string;

  /** Pre-signed GET URL for the memory photo (1-hour TTL) */
  @ApiPropertyOptional()
  mediaUrl?: string;

  @ApiPropertyOptional({ enum: ['streak_7', 'streak_30', 'goal_completed'] })
  milestoneKind?: 'streak_7' | 'streak_30' | 'goal_completed';

  @ApiPropertyOptional()
  streakDays?: number;

  @ApiProperty()
  createdAt!: Date;
}
