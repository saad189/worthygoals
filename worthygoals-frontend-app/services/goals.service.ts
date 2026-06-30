import { ApiGoal, GoalItem, GoalProposal } from "@/models";
import type { ApiCreateGoalPayload, ApiCreateGoalResponse } from '@/types/api';
import ApiService from "./api.service";
import { formatErrorMessage } from "@/helpers";
import Storage from "@/helpers/StorageUtilAsync";

const USER_GOALS = 'evolve-user-goals';
const mockGoals: GoalItem[] = [
    {
        id: "1",
        title: '20 Min Run in the Morning',
        description: 'Establish a Healthy Early Morning Routine by getting up at 0600 and going for a 20 Min Run.',
        durationInDays: 7,
        imageUri: 'https://images.pexels.com/photos/1199590/pexels-photo-1199590.jpeg',
        category: "Power",
        creationDate: new Date()
    },
    {
        id: "2",
        title: 'Hike a Mountain',
        description: 'Go for Nature-based experience/exercise. Hike a nearby mountain once a weekend.',
        durationInDays: 14,
        imageUri: 'https://images.pexels.com/photos/733162/pexels-photo-733162.jpeg',
        creationDate: new Date(),
        category: "Spiritual"
    },
    {
        id: "3",
        title: 'Start to Box',
        description: 'Establish a Good Athletic Routine by starting some boxing. Start by hitting the bag for 15 min sets daily.',
        durationInDays: 5,
        imageUri: 'https://images.pexels.com/photos/4761792/pexels-photo-4761792.jpeg',
        category: "Power",
        creationDate: new Date()
    },
];

export class GoalService {
    private goals: GoalItem[] | null = null;

    constructor(private readonly apiService: ApiService) { }

    // Ensure USER_GOALS is initialized with mockGoals if empty
    private async initializeGoals() {
        if (this.goals === null) {
            const records = await Storage.getItem(USER_GOALS);
            if (records && records.length > 0) {
                this.goals = records;
            } else {
                this.goals = [...mockGoals];
                await Storage.setItem(USER_GOALS, this.goals);
            }
        }
    }

    // Get the list of all goals
    async getUserGoals(): Promise<GoalItem[]> {
        try {
            await this.initializeGoals();
            return this.goals ?? [];
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    // Get details of a specific goal
    async getGoalById(goalId: string): Promise<GoalItem | null> {
        try {
            await this.initializeGoals();
            return this.goals?.find((goal: GoalItem) => goal.id === goalId) ?? null;
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    // Save or update a goal
    async saveGoal(updatedGoal: GoalItem) {
        try {
            await this.initializeGoals();

            if (!this.goals) {
                throw new Error('Goals not initialized.');
            }

            // Update or add the goal in the local cache
            const updatedGoals = this.goals.map((goal) =>
                goal.id === updatedGoal.id ? updatedGoal : goal
            );

            const goalExists = this.goals.some((goal) => goal.id === updatedGoal.id);
            if (!goalExists) {
                updatedGoals.push(updatedGoal);
            }

            // Update local cache and storage
            this.goals = updatedGoals;
            await Storage.setItem(USER_GOALS, this.goals);
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    // Reset all goals to mockGoals
    async resetGoals() {
        try {
            console.log('Resetting Goals...');
            await Storage.removeItem(USER_GOALS);
            this.goals = [...mockGoals];
            await Storage.setItem(USER_GOALS, this.goals);
            console.log('Goals reset to initial mockGoals.');
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }
}

const goalService = new GoalService(ApiService);

export default goalService;

const GOALS_BASE = '/goals';

export const goalsApiService = {
  list: async (): Promise<ApiGoal[]> => {
    const { data } = await ApiService.get<ApiGoal[]>(GOALS_BASE);
    return data ?? [];
  },

  propose: async (raw: string): Promise<GoalProposal> => {
    const { data } = await ApiService.post<GoalProposal>(`${GOALS_BASE}/propose`, { raw });
    return data;
  },

  create: async (payload: ApiCreateGoalPayload): Promise<ApiCreateGoalResponse> => {
    const { data } = await ApiService.post<ApiCreateGoalResponse>(GOALS_BASE, payload);
    return data;
  },
};
