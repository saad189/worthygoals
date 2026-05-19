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