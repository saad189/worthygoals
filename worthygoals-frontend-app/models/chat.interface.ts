export interface ChatListItem {
    id: string;
    name: string;
    avatar: any;
    lastMessage: string;
    time: string;
    isRead: boolean;
}

export interface ChatMessage {
    id: string;
    content: string | any;
    time: string;
    isRead: boolean;
}


export interface ChatDetail {
    id: string;
    name: string;
    avatar: any;
    messages: ChatMessage[];
}