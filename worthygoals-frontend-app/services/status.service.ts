import { StatusPost } from "@/models";
import ApiService, { AI_REQUEST_TIMEOUT_MS } from "./api.service";

const STATUS_BASE = "/status";

/** The backend's page size and cap for GET /status. */
export const STATUS_PAGE_SIZE = 50;

export const statusApiService = {
  /** Newest first. `before` is the createdAt of the oldest post already held. */
  list: async (before?: string): Promise<StatusPost[]> => {
    const { data } = await ApiService.get<StatusPost[]>(
      STATUS_BASE,
      before ? { before } : undefined,
    );
    return data ?? [];
  },

  create: async (text: string, mediaId?: string): Promise<StatusPost> => {
    // Three mentor reactions are generated before the post returns.
    const { data } = await ApiService.post<StatusPost>(
      STATUS_BASE,
      { text, ...(mediaId ? { mediaId } : {}) },
      { timeout: AI_REQUEST_TIMEOUT_MS },
    );
    return data;
  },
};
