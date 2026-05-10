import ApiService from "@/services/api.service";
import type { ApiMessage } from "@/models";

export const messagesService = {
  async list(params: {
    conversationId: string;
    limit?: number;
    before?: string; // ISO string
  }): Promise<ApiMessage[]> {
    const { data } = await ApiService.get<ApiMessage[]>("/messages", params);
    return data;
  },

  async sendTextMessage(params: {
    conversationId: string;
    text: string;
    clientMessageId?: string;
  }): Promise<ApiMessage> {
    const { data } = await ApiService.post<ApiMessage>("/messages", {
      conversationId: params.conversationId,
      text: params.text,
      clientMessageId: params.clientMessageId,
    });
    return data;
  },
};
