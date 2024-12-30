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
        avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOKOsPbE9WMa8ZO1iNNeFgoI0DWBjH8cMCwg&s',
        messages: [
            {
                id: 'm1',
                type: 'text',
                content: 'Getup Champ! This is the moment to takeover, No Rest, No Slacking, Champ...',
                time: '2024-12-29T10:28:54.088Z',
                isRead: true,
                senderId: 'coach',
            },
            {
                id: 'm2',
                type: 'text',
                content: 'Come On Man! Embrace the Suck.',
                time: '2024-12-29T11:28:54.088Z',
                isRead: true,
                senderId: 'coach',
            },
            {
                id: 'm3',
                type: 'image',
                content: 'https://mmajunkie.usatoday.com/wp-content/uploads/sites/91/2017/01/conor-mcgregor-ufc-205.jpg?w=1000&h=600&crop=1', // URL to an image
                time: '2024-12-29T11:38:54.088Z',
                isRead: true,
                senderId: 'coach',
            },
            {
                id: 'm4',
                type: 'text',
                content: 'Alright! I’m Up, Give me a Minute.',
                time: '2024-12-29T12:28:54.088Z',
                isRead: true,
                senderId: 'user',
            },
            {
                id: 'm5',
                type: 'text',
                content: 'That’s it! My Man.... Lets Fu@#ing Go!',
                time: '2024-12-29T12:38:54.088Z',
                isRead: true,
                senderId: 'coach',
            },
            {
                id: 'm6',
                type: 'text',
                content:
                    'GOALS #01: Want to Go for an Early Morning Run Every Day of the Week, Starting Now. I want to be Active in the Mornings!',
                time: '2024-12-30T10:28:54.088Z',
                isRead: false,
                senderId: 'coach',
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
            senderId: ""
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

            await Storage.setItem(USER_CHATS, [chat, ...chats]);

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