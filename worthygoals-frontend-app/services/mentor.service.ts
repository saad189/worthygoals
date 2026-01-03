import { Mentor } from "@/models";
import ApiService from "./api.service";
import { formatErrorMessage } from "@/helpers";

const toUpdateMentorDto = (mentor: Mentor) => {
  return {
    name: mentor.name,
    slug: mentor.slug,
    title: mentor.title,
    shortDescription: mentor.shortDescription,
    longDescription: mentor.longDescription,
    avatarUrl: mentor.avatarUrl,
    coverImageUrl: mentor.coverImageUrl,
    language: mentor.language,
    supportedLanguages: mentor.supportedLanguages,
    communicationStyle: mentor.communicationStyle,
    responseLength: mentor.responseLength,
    personalityTraits: mentor.personalityTraits,
    promptBlocks: mentor.promptBlocks,
    topicPolicy: mentor.topicPolicy,
    safetyPolicy: mentor.safetyPolicy,
    memoryPolicy: mentor.memoryPolicy,
    isActive: mentor.isActive,
    visibility: mentor.visibility,
    isPremium: mentor.isPremium,
    requiredPlan: mentor.requiredPlan,
    version: mentor.version,
  };
};

export class MentorService {
  constructor(private readonly apiService: ApiService) {}

  private endpoint = "/mentors";

  // Get the list of all mentors
  async getMentorList(): Promise<Mentor[]> {
    try {
      const { data } = await this.apiService.get<Mentor[]>(this.endpoint);
      return data ?? [];
    } catch (error: any) {
      throw new Error(formatErrorMessage(error));
    }
  }

  // Get details of a specific mentor
  async getMentorById(mentorId: number): Promise<Mentor | null> {
    try {
      const { data } = await this.apiService.get<Mentor>(
        `${this.endpoint}/${mentorId}`
      );
      return data ?? null;
    } catch (error: any) {
      throw new Error(formatErrorMessage(error));
    }
  }

  // Save or update a mentor
  async saveMentor(updatedMentor: Mentor) {
    try {
      if (!updatedMentor?.id) {
        throw new Error("Mentor id is required to update.");
      }

      const updateDto = toUpdateMentorDto(updatedMentor);
      await this.apiService.patch(
        `${this.endpoint}/${updatedMentor.id}`,
        updateDto
      );
    } catch (error: any) {
      throw new Error(formatErrorMessage(error));
    }
  }

  // Reset mentors to initial MENTOR_DATA
  async resetMentors() {
    try {
      // No backend endpoint exists for a global "reset".
      // Keep this method as a safe no-op to avoid breaking callers.
      return;
    } catch (error: any) {
      throw new Error(formatErrorMessage(error));
    }
  }
}

const mentorService = new MentorService(ApiService);
export default mentorService;
