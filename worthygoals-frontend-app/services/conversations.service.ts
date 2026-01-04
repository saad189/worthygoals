import ApiService from "@/services/api.service";
import config from "@/constants/Config";
import { formatErrorMessage } from "@/helpers";
import type {
  ConversationDetail,
  ConversationListItem,
  ConversationMessage,
} from "@/models";

type ApiConversation = {
  id?: string;
  conversationId?: string;
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

function extractConversationId(conversation: any): string {
  const id = conversation?.id ?? conversation?.conversationId;
  if (!id) {
    const keys =
      conversation && typeof conversation === "object"
        ? Object.keys(conversation).join(", ")
        : typeof conversation;
    const message =
      conversation &&
      typeof conversation === "object" &&
      "message" in conversation
        ? (conversation as any).message
        : undefined;

    const messageText = Array.isArray(message)
      ? message.join(", ")
      : typeof message === "string"
      ? message
      : undefined;

    throw new Error(
      messageText
        ? `Couldn't start chat: ${messageText}`
        : `Couldn't find conversationId in response (keys: ${keys})`
    );
  }
  return String(id);
}

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

      // Only show conversations that exist.
      const { data } = await this.api.get<ApiConversation[]>(
        `/${this.endpoint}`,
        {
          include: "mentor",
        }
      );

      return (data ?? []).map((c) => {
        const conversationId = extractConversationId(c);
        const name = c.mentor?.name ?? `Mentor ${c.mentorId}`;
        const avatar = c.mentor?.avatarUrl || c.mentor?.coverImageUrl || "";
        const time = c.lastMessageAt || c.createdAt;

        return {
          id: conversationId, // conversationId
          name,
          avatar,
          lastMessage: "",
          time,
          isRead: true,
        };
      });
    } catch (error: any) {
      throw new Error(formatErrorMessage(error));
    }
  }

  async getConversationShellByConversationId(
    conversationId: string
  ): Promise<ConversationDetail> {
    try {
      this.assertApiConfigured();
      if (!conversationId) throw new Error("conversationId is required");

      const { data: full } = await this.api.get<ApiConversation>(
        `/${this.endpoint}/${conversationId}`,
        { include: "mentor" }
      );

      const fullConversationId = extractConversationId(full);

      const name = full.mentor?.name ?? `Mentor ${full.mentorId}`;
      const avatar = full.mentor?.avatarUrl || full.mentor?.coverImageUrl || "";

      return {
        id: fullConversationId,
        name,
        avatar,
        messages: [],
        userId: 0,
        mentorId: full.mentorId,
      };
    } catch (error: any) {
      throw new Error(formatErrorMessage(error));
    }
  }

  async getOrCreateConversationByMentorId(
    mentorId: number
  ): Promise<ApiConversation> {
    try {
      this.assertApiConfigured();

      const { data: existing } = await this.api.get<any>(`/${this.endpoint}`, {
        mentorId,
        include: "mentor",
      });

      let conversation: any;

      if (Array.isArray(existing)) {
        conversation = (existing ?? [])[0];
      } else {
        // If the API returns an error-like payload (e.g., { message: ... })
        // treat it as invalid.
        conversation = existing;
      }

      if (!conversation || !extractConversationId(conversation)) {
        const { data: created } = await this.api.post<any>(
          `/${this.endpoint}`,
          { mentorId }
        );
        conversation = created;
      }

      // Ensure we always have an id to use for subsequent calls.
      extractConversationId(conversation);
      return conversation;
    } catch (error: any) {
      throw new Error(formatErrorMessage(error));
    }
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

      const conversationId = extractConversationId(conversation);

      const { data: full } = await this.api.get<ApiConversation>(
        `/${this.endpoint}/${conversationId}`,
        { include: "mentor" }
      );

      const { data: messages } = await this.api.get<ApiMessage[]>("/messages", {
        conversationId,
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
        id: conversationId,
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

  async getConversationShellByMentorId(
    mentorId: number
  ): Promise<ConversationDetail> {
    this.assertApiConfigured();
    if (!mentorId) throw new Error("Invalid mentor id for conversation");

    const conversation = await this.getOrCreateConversationByMentorId(mentorId);

    const conversationId = extractConversationId(conversation);
    return this.getConversationShellByConversationId(conversationId);
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
