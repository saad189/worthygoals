import { ChatDetail, ChatListItem, ChatMessage } from "@/models";
import ApiService from "./api.service";
import { formatErrorMessage } from "@/helpers";
import Storage from "@/helpers/StorageUtilAsync";

// Note that Chat and ChatList are different
const USER_CHATS = 'user-chats';
const CHAT_DATA: ChatDetail[] = [
    {
        id: '1',
        name: 'McGregor',
        avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOKOsPbE9WMa8ZO1iNNeFgoI0DWBjH8cMCwg&s',
        messages: [
            {
                id: 'm1',
                type: 'text',
                content: 'Getup Champ! This is the moment to takeover, No Rest, No Slacking, Champ...',
                time: '2024-12-29T10:28:54.088Z',
                isRead: true,
                senderId: 'coach',
                recepientType: "user"
            },
            {
                id: 'm2',
                type: 'text',
                content: 'Come On Man! Embrace the Suck.',
                time: '2024-12-29T11:28:54.088Z',
                isRead: true,
                senderId: 'coach',
                recepientType: "user"
            },
            {
                id: 'm3',
                type: 'image',
                content: 'https://mmajunkie.usatoday.com/wp-content/uploads/sites/91/2017/01/conor-mcgregor-ufc-205.jpg?w=1000&h=600&crop=1', // URL to an image
                time: '2024-12-29T11:38:54.088Z',
                isRead: true,
                senderId: 'coach',
                recepientType: "user"
            },
            {
                id: 'm4',
                type: 'text',
                content: 'Alright! I’m Up, Give me a Minute.',
                time: '2024-12-29T12:28:54.088Z',
                isRead: true,
                senderId: 'user',
                recepientType: "mentor"
            },
            {
                id: 'm5',
                type: 'text',
                content: 'That’s it! My Man.... Lets Fu@#ing Go!',
                time: '2024-12-29T12:38:54.088Z',
                isRead: true,
                senderId: 'coach',
                recepientType: "user"
            },
            {
                id: 'm6',
                type: 'text',
                content: 'GOALS #01: Want to Go for an Early Morning Run Every Day of the Week, Starting Now. I want to be Active in the Mornings!',
                time: '2024-12-30T10:28:54.088Z',
                isRead: false,
                senderId: 'coach',
                recepientType: "user"
            },
        ],
    },
    {
        id: '2',
        name: 'Dr. Peterson',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Jordan_Peterson_by_Gage_Skidmore.jpg/800px-Jordan_Peterson_by_Gage_Skidmore.jpg',
        messages: [{
            id: '1',
            content: '“Become One” says Dostoyevsky, because he knows...',
            time: '2024-12-25T12:28:54.088Z',
            isRead: true,
            type: "text",
            senderId: "",
            recepientType: "user"
        }],
    },
    {
        id: '3',
        name: 'Scarlett',
        avatar: 'https://m.media-amazon.com/images/M/MV5BMTM3OTUwMDYwNl5BMl5BanBnXkFtZTcwNTUyNzc3Nw@@._V1_.jpg',
        messages: [{
            id: '1',
            content: 'Hey! How are you. Today is such a Beautiful Day...',
            time: '2024-12-26T10:28:54.088Z',
            isRead: true,
            type: "text",
            senderId: "",
            recepientType: "user"
        }],
    },
];
export class ChatService {
    private endpoint: string;
    private chats: ChatDetail[] | null = null; // Local cache for chats

    constructor(private readonly apiService: ApiService) {
        this.endpoint = 'chats';
    }

    // Ensure USER_CHATS is initialized with CHAT_DATA if empty
    private async initializeChats() {
        if (this.chats === null) {
            const records = await Storage.getItem(USER_CHATS);
            if (records && records.length > 0) {
                this.chats = records;
            } else {
                // Initialize with CHAT_DATA if no chats exist
                this.chats = [...CHAT_DATA];
                await Storage.setItem(USER_CHATS, this.chats);
            }
        }
    }

    // Get the list of all chats
    async getUserChatList(): Promise<ChatListItem[]> {
        try {
            await this.initializeChats();

            if (this.chats) {
                return this.chats.map((chat: ChatDetail) => ({
                    id: chat.id,
                    name: chat.name,
                    avatar: chat.avatar,
                    lastMessage: chat.messages[chat.messages.length - 1]?.content || '',
                    time: chat.messages[chat.messages.length - 1]?.time || '',
                    isRead: chat.messages[chat.messages.length - 1]?.isRead || chat.messages[chat.messages.length - 1]?.recepientType == 'mentor' || false,
                }));
            }

            return [];
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    // Get details of a specific chat
    async getUserChat(chatId: string): Promise<ChatDetail | null> {
        try {
            await this.initializeChats();
            return this.chats?.find((c: ChatDetail) => c.id === chatId) ?? null;
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    // Save a new message to a specific chat
    async saveMessage(chatId: string, message: ChatMessage) {
        try {
            const chat = await this.getUserChat(chatId);

            if (!chat) {
                throw new Error(`Chat with id ${chatId} not found.`);
            }

            // Add the new message to the chat
            const updatedChat: ChatDetail = {
                ...chat,
                messages: [...chat.messages, message],
            };

            // Save the updated chat
            await this.saveChat(updatedChat);
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    // Save or update a chat
    async saveChat(updatedChat: ChatDetail) {
        try {
            await this.initializeChats();

            if (!this.chats) {
                throw new Error('Chats not initialized.');
            }

            // Update or add the chat in the local cache
            const updatedChats = this.chats.map((chat) =>
                chat.id === updatedChat.id ? updatedChat : chat
            );

            const chatExists = this.chats.some((chat) => chat.id === updatedChat.id);
            if (!chatExists) {
                updatedChats.push(updatedChat);
            }

            // Update local cache and storage
            this.chats = updatedChats;
            await Storage.setItem(USER_CHATS, this.chats);
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    // Clear all chats and reinitialize with CHAT_DATA
    async resetChats() {
        try {
            console.log('Resetting Chats...');
            await Storage.removeItem(USER_CHATS);
            this.chats = [...CHAT_DATA];
            await Storage.setItem(USER_CHATS, this.chats);
            console.log('Chats reset to initial CHAT_DATA.');
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }
}

const chatService = new ChatService(ApiService);

export default chatService;

