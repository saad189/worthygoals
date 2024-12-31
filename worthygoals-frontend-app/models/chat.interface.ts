// models.ts

export interface ChatListItem {
    id: string;
    name: string;
    avatar: string;   // you can store URIs or local require(...)
    lastMessage: string;
    time: string;     // e.g. "5:30 AM"
    isRead: boolean;
}

export type MessageType = 'text' | 'image' | 'audio' | 'video';
export type ReceipientType = 'user' | 'mentor'
export interface ChatMessage {
    id: string;
    type: MessageType;
    content: string;      // text, or URL for media
    time: string;         // "5:30 AM", for example
    isRead: boolean;
    recepientType: ReceipientType;
    senderId: string;     // e.g. "user" or "coach" or something unique
}

export interface ChatDetail {
    id: string;
    name: string;
    avatar: string;
    messages: ChatMessage[];
    userId: number;
    mentorId: number;
}
