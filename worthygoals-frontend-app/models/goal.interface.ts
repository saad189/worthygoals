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
    id: number;
    title: string;
    description: string;
    durationInDays: number; // in Days
    imageUri: string;
    category: GoalCategory;
    creationDate: Date;
}