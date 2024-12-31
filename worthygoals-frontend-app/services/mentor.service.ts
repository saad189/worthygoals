import { Mentor } from "@/models";
import ApiService from "./api.service";
import { formatErrorMessage } from "@/helpers";
import Storage from "@/helpers/StorageUtilAsync";

const USER_MENTORS = "user-mentors";
const MENTOR_DATA: Mentor[] = [
    {
        id: 1,
        name: "McGregor",
        description: "A motivational mentor to keep you going.",
        personalityStats: { energy: 90, focus: 80 },
        imageUri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOKOsPbE9WMa8ZO1iNNeFgoI0DWBjH8cMCwg&s",
    },
    {
        id: 2,
        name: "Dr. Peterson",
        description: "A philosophical mentor for deep insights.",
        personalityStats: { wisdom: 95, patience: 85 },
        imageUri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Jordan_Peterson_by_Gage_Skidmore.jpg/800px-Jordan_Peterson_by_Gage_Skidmore.jpg",
    },
    {
        id: 3,
        name: "Scarlett",
        description: "A cheerful mentor to brighten your day.",
        personalityStats: { empathy: 88, charisma: 90 },
        imageUri: "https://m.media-amazon.com/images/M/MV5BMTM3OTUwMDYwNl5BMl5BanBnXkFtZTcwNTUyNzc3Nw@@._V1_.jpg",
    },
];

export class MentorService {
    private mentors: Mentor[] | null = null;

    constructor(private readonly apiService: ApiService) { }

    // Ensure USER_MENTORS is initialized with MENTOR_DATA if empty
    private async initializeMentors() {
        if (this.mentors === null) {
            const records = await Storage.getItem(USER_MENTORS);
            if (records && records.length > 0) {
                this.mentors = records;
            } else {
                this.mentors = [...MENTOR_DATA];
                await Storage.setItem(USER_MENTORS, this.mentors);
            }
        }
    }

    // Get the list of all mentors
    async getMentorList(): Promise<Mentor[]> {
        try {
            await this.initializeMentors();
            return this.mentors || [];
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    // Get details of a specific mentor
    async getMentorById(mentorId: number): Promise<Mentor | null> {
        try {
            await this.initializeMentors();
            return this.mentors?.find((mentor) => mentor.id === mentorId) ?? null;
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    // Save or update a mentor
    async saveMentor(updatedMentor: Mentor) {
        try {
            await this.initializeMentors();

            if (!this.mentors) {
                throw new Error("Mentors not initialized.");
            }

            // Update or add the mentor in the local cache
            const updatedMentors = this.mentors.map((mentor) =>
                mentor.id === updatedMentor.id ? updatedMentor : mentor
            );

            const mentorExists = this.mentors.some((mentor) => mentor.id === updatedMentor.id);
            if (!mentorExists) {
                updatedMentors.push(updatedMentor);
            }

            // Update local cache and storage
            this.mentors = updatedMentors;
            await Storage.setItem(USER_MENTORS, this.mentors);
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    // Reset mentors to initial MENTOR_DATA
    async resetMentors() {
        try {
            console.log("Resetting Mentors...");
            await Storage.removeItem(USER_MENTORS);
            this.mentors = [...MENTOR_DATA];
            await Storage.setItem(USER_MENTORS, this.mentors);
            console.log("Mentors reset to initial MENTOR_DATA.");
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }
}

const mentorService = new MentorService(ApiService);
export default mentorService;
