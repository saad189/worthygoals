export type ConversationMessageType = "text" | "image" | "audio" | "video";
export type ConversationRecipientType = "user" | "mentor";

export interface ConversationListItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  isRead: boolean;
}

export interface ConversationMessage {
  id: string;
  type: ConversationMessageType;
  content: string;
  time: string;
  isRead: boolean;
  recepientType: ConversationRecipientType;
  senderId: string;
}

export interface ConversationDetail {
  id: string;
  name: string;
  avatar: string;
  messages: ConversationMessage[];
  userId: number;
  mentorId: number;
}
