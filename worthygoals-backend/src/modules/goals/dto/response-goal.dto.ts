import { GoalCategory, GoalStatus } from 'src/common/constants';

export class ResponseGoalDto {
  id: string;
  userId: number;
  mentorId?: number;
  title: string;
  description?: string;
  category: GoalCategory;
  status: GoalStatus;
  costText?: string;
  benefitText?: string;
  failureText?: string;
  deadline?: Date;
  repeatRule?: Record<string, unknown>;
  stakeAmount?: number;
  imageUri?: string;
  createdAt: Date;
  updatedAt: Date;
}
