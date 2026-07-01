import { ApiProperty } from '@nestjs/swagger';

export type WeekTrend = 'up' | 'flat' | 'down';

/** One goal's week, with its mentor's in-voice commentary (Hi-Fi flow ⑥, screen 15). */
export class GoalWeekRowDto {
  @ApiProperty()
  goalId!: string;

  @ApiProperty()
  title!: string;

  /** personalityId slug — marcus / lyra / goggs. Drives the avatar + voice styling. */
  @ApiProperty()
  mentorPersonalityId!: string;

  @ApiProperty()
  mentorName!: string;

  @ApiProperty({ description: 'Completions logged this week (Mon–Sun).' })
  thisWeekCount!: number;

  @ApiProperty({ description: 'Completions logged the prior week.' })
  lastWeekCount!: number;

  @ApiProperty({ description: 'thisWeekCount − lastWeekCount.' })
  delta!: number;

  @ApiProperty({ enum: ['up', 'flat', 'down'] })
  trend!: WeekTrend;

  @ApiProperty({
    description: 'No completions this week — the row to talk about.',
  })
  danger!: boolean;

  @ApiProperty({
    description: "The goal's mentor reacting to the week, in voice.",
  })
  commentary!: string;
}

export class WeeklyReviewDto {
  @ApiProperty({ description: 'Monday 00:00 of the week under review (ISO).' })
  weekStart!: string;

  @ApiProperty({
    description: 'Sunday 23:59:59 of the week under review (ISO).',
  })
  weekEnd!: string;

  @ApiProperty({ description: 'ISO week number.' })
  weekNumber!: number;

  @ApiProperty({ description: 'Goals with at least one completion this week.' })
  onTrackCount!: number;

  @ApiProperty()
  totalGoals!: number;

  @ApiProperty({ type: [GoalWeekRowDto] })
  goals!: GoalWeekRowDto[];
}
