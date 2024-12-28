import { ChatDetail, ChatListItem } from "@/models";
import ApiService from "./api.service";
import { formatErrorMessage } from "@/helpers";
import Storage from "@/helpers/StorageUtil";

// Note that Chat and ChatList are different
const USER_CHATS = 'user-chats';
const CHAT_DATA: ChatDetail[] = [
    {
        id: '1',
        name: 'McGregor',
        avatar: require('@/assets/images/icon.png'),
        messages: [{
            id: '1',
            content: 'Getup Champ! This is the moment to takeover, No Rest...',
            time: '2024-12-26T14:28:54.088Z',
            isRead: false,
            type: "text",
            senderId: ""
        }],
    },
    {
        id: '2',
        name: 'Dr. Peterson',
        avatar: require('@/assets/images/icon.png'),
        messages: [{
            id: '1',
            content: '“Become One” says Dostoyevsky, because he knows...',
            time: '2024-12-25T12:28:54.088Z',
            isRead: true,
            type: "text",
            senderId: ""
        }],
    },
    {
        id: '3',
        name: 'Scarlett',
        avatar: require('@/assets/images/icon.png'),
        messages: [{
            id: '1',
            content: 'Hey! How are you. Today is such a Beautiful Day...',
            time: '2024-12-26T10:28:54.088Z',
            isRead: true,
            type: "text",
            senderId: ""
        }],
    },
];
export class ChatService {

    private endpoint: string;

    constructor(private readonly apiService: ApiService) {
        this.endpoint = 'chats';
        this.removeChats();

    }

    async getUserChatList(): Promise<ChatListItem[]> {
        try {
            const records = await Storage.getItem(USER_CHATS);
            console.log({ records })
            if (records) {
                return records.map((chat: ChatDetail) => (
                    {
                        id: chat.id,
                        name: chat.name,
                        avatar: chat.avatar,
                        lastMessage: chat.messages[chat.messages.length - 1].content,
                        time: chat.messages[chat.messages.length - 1].time,
                        isRead: chat.messages[chat.messages.length - 1].isRead
                    }
                ));
            }

            return [];

        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    async getUserChat(chatId: string): Promise<ChatDetail | null> {
        try {
            const records = Storage.getItem(USER_CHATS);
            const chats: ChatDetail[] = await records ?? [];

            const chat = chats.find((c: ChatDetail) => c.id === chatId);

            return chat ?? null;

        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }


    async saveChat(chat: any) {
        try {
            const records = Storage.getItem(USER_CHATS);
            const chats: ChatDetail[] = await records ?? [];
            console.log({ chats, chat })
            await Storage.setItem(USER_CHATS, JSON.stringify([chat, ...chats]));

        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    async removeChats() {
        try {
            console.log('Removing Chats');
            await Storage.removeItem(USER_CHATS);
            for (let i = 0; i < CHAT_DATA.length; i++) {
                await this.saveChat(CHAT_DATA[i]);
            }
            console.log('Chat Data Saved')
        } catch (error: any) {
            //   throw new Error(formatErrorMessage(error));
        }
    }
}

const chatService = new ChatService(ApiService);

export default chatService;