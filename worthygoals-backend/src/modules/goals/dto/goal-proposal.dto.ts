import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalCategory } from 'src/common/constants';

export class GoalProposalDto {
  @ApiProperty({ example: 'Run a half-marathon' })
  title: string;

  @ApiPropertyOptional({ example: '13.1 miles of training time and physical discomfort' })
  costText?: string;

  @ApiPropertyOptional({ example: 'Improved cardiovascular health and personal accomplishment' })
  benefitText?: string;

  @ApiPropertyOptional({ example: 'Letting sedentary habits win; missing the October race window' })
  failureText?: string;

  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' })
  deadline?: string;

  @ApiPropertyOptional({ example: { frequency: 'weekly', days: [1, 3, 6] } })
  repeatRule?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: GoalCategory })
  category?: GoalCategory;

  @ApiPropertyOptional({ example: 'Maintain a weekly schedule of long-run, tempo, and recovery runs.' })
  description?: string;
}
