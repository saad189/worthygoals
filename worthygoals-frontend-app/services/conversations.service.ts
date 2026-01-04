import ApiService from "@/services/api.service";
import mentorService from "@/services/mentor.service";
import config from "@/constants/Config";
import { formatErrorMessage } from "@/helpers";
import type {
  ConversationDetail,
  ConversationListItem,
  ConversationMessage,
} from "@/models";

type ApiConversation = {
  id: string;
  mentorId: number;
  createdAt: string;
  lastMessageAt: string | null;
  mentor?: {
    id: number;
    name: string;
    avatarUrl?: string;
    coverImageUrl?: string;
  };
};

type ApiMessage = {
  id: string;
  conversationId: string;
  role: string;
  contentType: string;
  text: string | null;
  clientMessageId: string | null;
  createdAt: string;
};

export class ConversationsService {
  private endpoint = "conversations";

  constructor(private readonly api = ApiService) {}

  private assertApiConfigured() {
    if (!config.apiUrl) {
      throw new Error(
        "EXPO_PUBLIC_API_URL is not set. Cannot load conversations from backend."
      );
    }
  }

  async getUserConversationList(): Promise<ConversationListItem[]> {
    try {
      this.assertApiConfigured();

      // Current UX: conversation list == mentors list (conversation created on demand)
      const mentors = await mentorService.getMentorList();
      return mentors.map((m) => ({
        id: String(m.id),
        name: m.name,
        avatar: m.avatarUrl || m.coverImageUrl || "",
        lastMessage: "",
        time: new Date().toISOString(),
        isRead: true,
      }));
    } catch (error: any) {
      throw new Error(formatErrorMessage(error));
    }
  }

  async getOrCreateConversationByMentorId(
    mentorId: number
  ): Promise<ApiConversation> {
    const { data: existing } = await this.api.get<ApiConversation[]>(
      `/${this.endpoint}`,
      { mentorId, include: "mentor" }
    );

    let conversation: ApiConversation | undefined = (existing ?? [])[0];

    if (!conversation) {
      const { data: created } = await this.api.post<ApiConversation>(
        `/${this.endpoint}`,
        { mentorId }
      );
      conversation = created;
    }

    return conversation;
  }

  async getConversationDetailByMentorId(
    mentorId: number
  ): Promise<ConversationDetail | null> {
    try {
      this.assertApiConfigured();
      if (!mentorId) throw new Error("Invalid mentor id for conversation");

      const conversation = await this.getOrCreateConversationByMentorId(
        mentorId
      );

      const { data: full } = await this.api.get<ApiConversation>(
        `/${this.endpoint}/${conversation.id}`,
        { include: "mentor" }
      );

      const { data: messages } = await this.api.get<ApiMessage[]>("/messages", {
        conversationId: conversation.id,
      });

      const name = full.mentor?.name ?? `Mentor ${full.mentorId}`;
      const avatar = full.mentor?.avatarUrl || full.mentor?.coverImageUrl || "";

      const mapped: ConversationMessage[] = (messages ?? []).map((m) => ({
        id: m.id,
        type: "text",
        content: m.text ?? "",
        time: m.createdAt,
        isRead: true,
        senderId: m.role === "user" ? "user" : "coach",
        recepientType: m.role === "user" ? "mentor" : "user",
      }));

      return {
        id: conversation.id,
        name,
        avatar,
        messages: mapped,
        userId: 0,
        mentorId: full.mentorId,
      };
    } catch (error: any) {
      throw new Error(formatErrorMessage(error));
    }
  }

  async sendTextMessage(params: {
    conversationId: string;
    text: string;
  }): Promise<ConversationMessage> {
    try {
      this.assertApiConfigured();
      const { data } = await this.api.post<ApiMessage>("/messages", {
        conversationId: params.conversationId,
        text: params.text,
      });

      return {
        id: data.id,
        type: "text",
        content: data.text ?? params.text,
        time: data.createdAt,
        isRead: true,
        senderId: "user",
        recepientType: "mentor",
      };
    } catch (error: any) {
      throw new Error(formatErrorMessage(error));
    }
  }
}

const conversationsService = new ConversationsService(ApiService);
export default conversationsService;
