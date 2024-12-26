import { ChatDetail, ChatListItem } from "@/models";
import ApiService from "./api.service";
import { formatErrorMessage } from "@/helpers";
import Storage from "@/helpers/StorageUtil";

// Note that Chat and ChatList are different
const USER_CHATS = 'user-chats';
export class DeedsService {

    private endpoint: string;

    constructor(private readonly apiService: ApiService) {
        this.endpoint = 'chats';

    }

    async getUserChatList(): Promise<ChatListItem[]> {
        try {
            const records = await Storage.getItem(USER_CHATS);

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

            await Storage.setItem(USER_CHATS, JSON.stringify([chat, ...chats]));

        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    async removeChats() {
        try {
            console.log('Removing Chats');
            await Storage.removeItem(USER_CHATS);
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }
}

const deedsService = new DeedsService(ApiService);

export default deedsService;