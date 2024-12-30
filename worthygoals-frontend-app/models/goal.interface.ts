import { Chip, ImageCard } from ".";

export interface SelectGoal {
    card: ImageCard;
    tasks: Chip[];
    id: number;
}
export interface GoalItem {
    id: number;
    title: string;
    description: string;
    duration: string;
    imageUri: string;
}