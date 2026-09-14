import { Mentor } from "@/models";
import ApiService from "./api.service";
import { formatErrorMessage } from "@/helpers";

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
}

const mentorService = new MentorService(ApiService);
export default mentorService;
