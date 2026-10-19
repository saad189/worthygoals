import { Chip, ImageCard } from ".";
import type { components } from "@/types/api.gen";

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

// The shape returned by GET /goals, generated from the backend's
// ResponseGoalDto via openapi.json (the pre-push contract gate keeps it current).
export type ApiGoal = components['schemas']['ResponseGoalDto'];
/** `paused` is "Pause this goal"; `archived` is "Let it go". */
export type GoalStatus = ApiGoal['status'];

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