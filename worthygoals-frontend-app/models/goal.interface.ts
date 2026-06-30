import { Chip, ImageCard } from ".";

export enum GoalCategoryEnum {
    Power = "power",
    Knowledge = "knowledge",
    Spiritual = "spiritual",
}

export type GoalCategory = keyof typeof GoalCategoryEnum;
export interface SelectGoal {
    card: ImageCard;
    tasks: Chip[];
    id: number;
}
export interface GoalItem {
    id: string;
    title: string;
    description: string;
    durationInDays: number; // in Days
    imageUri: string;
    category: GoalCategory;
    creationDate: Date;
}

// The shape returned by GET /goals (the backend's ResponseGoalDto). That route
// isn't described in openapi.json yet, so this is hand-written to match it —
// keep in sync with src/modules/goals/dto/response-goal.dto.ts on the backend.
export interface ApiGoal {
    id: string;
    userId: number;
    mentorId?: number;
    title: string;
    description?: string;
    category: string;
    status: string;
    costText?: string;
    benefitText?: string;
    failureText?: string;
    stakeAmount?: number;
    imageUri?: string;
    createdAt: string;
    updatedAt: string;
}

export interface GoalProposal {
    title: string;
    description?: string;
    costText?: string;
    benefitText?: string;
    failureText?: string;
    deadline?: string;
    repeatRule?: Record<string, unknown>;
    category?: string;
}