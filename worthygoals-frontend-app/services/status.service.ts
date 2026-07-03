import { StatusPost } from "@/models";
import ApiService from "./api.service";

const STATUS_BASE = "/status";

export const statusApiService = {
  list: async (): Promise<StatusPost[]> => {
    const { data } = await ApiService.get<StatusPost[]>(STATUS_BASE);
    return data ?? [];
  },

  create: async (text: string, mediaId?: string): Promise<StatusPost> => {
    const { data } = await ApiService.post<StatusPost>(STATUS_BASE, {
      text,
      ...(mediaId ? { mediaId } : {}),
    });
    return data;
  },
};
