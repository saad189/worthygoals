import ApiService from "./api.service";
import { formatErrorMessage } from "@/helpers";
import Storage from "@/helpers/StorageUtilAsync";
import { BoardsCardItem } from "@/models";

const CARDS_DATA: BoardsCardItem[] = [
    {
        id: 1,
        type: "quote",
        author: "William James",
        uri: "https://plus.unsplash.com/premium_photo-1671599016130-7882dbff302f?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        category: "Workout",
        borderColor: "#E0748F",
    },
    {
        id: 2,
        type: "quote",
        uri: "https://images.unsplash.com/photo-1534196511436-921a4e99f297?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        author: "Scarlett Johansson",
        category: "Workout",
        borderColor: "#4995E2",
    },
    {
        id: 3,
        type: "image",
        uri: "https://images.unsplash.com/photo-1523293836414-f04e712e1f3b?q=80&w=2503&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        author: "Scarlett Johansson",
        category: "Books",
        borderColor: "#D87EEC",
    },
    {
        id: 4,
        type: "quote",
        uri: "https://images.unsplash.com/photo-1528716321680-815a8cdb8cbe?q=80&w=2565&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        author: "Walt Whitman",
        category: "Books",
        borderColor: "#D87EEC",
    },
    {
        id: 5,
        type: "image",
        uri: "https://images.unsplash.com/photo-1495001258031-d1b407bc1776?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        author: "",
        category: "Reading",
        borderColor: "#E0748F",
    },
    {
        id: 6,
        type: "image",
        uri: "https://scontent.flhe7-2.fna.fbcdn.net/v/t39.30808-6/470494569_1136674987816262_8580751451923588465_n.jpg?stp=dst-jpg_p526x296_tt6&_nc_cat=107&ccb=1-7&_nc_sid=833d8c&_nc_ohc=Tjby4ED9xC4Q7kNvgFgt8L0&_nc_oc=Adi9R-DufI9dgsi6_4eAsCvgH_Fq_E8FihdPrJ60tL-0Qb7AAbn2fMVeOHAWkK9RE8Q&_nc_zt=23&_nc_ht=scontent.flhe7-2.fna&_nc_gid=Ab_UM_SKe3gKOe1IHiKmPUX&oh=00_AYBR7-xZNDBU6eTZu7x8mCWUuIpP5lE-EdUANtM-phruMw&oe=67864484",
        author: "",
        category: "Reading",
        borderColor: "#E0748F",
    },
    {
        id: 7,
        type: "image",
        uri: "https://images.unsplash.com/photo-1608999383953-d61f5d9c1ace?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        author: "",
        category: "Reading",
        borderColor: "#4995E2",
    },
    {
        id: 8,
        type: "image",
        uri: "https://images.unsplash.com/photo-1669477377105-0736689c9935?q=80&w=2021&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        author: "",
        category: "Reading",
        borderColor: "#4995E2",
    },
];

const USER_BOARDS = "user-boards"; // key to store/fetch boards from AsyncStorage

export class InspirationService {
    private endpoint: string;
    private cards: BoardsCardItem[] | null = null; // local in-memory cache

    constructor(private readonly apiService: ApiService) {
        this.endpoint = "boards";
    }

    /**
     * Initializes the boards if not already in memory by:
     *  - Checking local storage.
     *  - If none found, sets default data and saves it.
     */
    private async initializeCards() {
        if (this.cards === null) {
            const storedRecords = await Storage.getItem(USER_BOARDS);
            if (storedRecords && storedRecords.length > 0) {
                this.cards = storedRecords;
            } else {
                // Load default data if none in storage
                this.cards = [...CARDS_DATA];
                await Storage.setItem(USER_BOARDS, this.cards);
            }
        }
    }

    /**
     * Fetch all boards.
     */
    async getAllCards(): Promise<BoardsCardItem[]> {
        try {
            await this.initializeCards();
            return this.cards ?? [];
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    /**
     * Fetch a single card by its ID.
     */
    async getCardById(cardId: number): Promise<BoardsCardItem | null> {
        try {
            await this.initializeCards();
            return this.cards?.find((card) => card.id === cardId) ?? null;
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    /**
     * Add a new card or update an existing one.
     */
    async saveCard(cardData: BoardsCardItem) {
        try {
            await this.initializeCards();
            if (!this.cards) {
                throw new Error("Cards not initialized.");
            }

            // Check if card already exists
            const existingIndex = this.cards.findIndex((c) => c.id === cardData.id);

            if (existingIndex !== -1) {
                // Update existing card
                this.cards[existingIndex] = cardData;
            } else {
                // Add new card
                this.cards.push(cardData);
            }

            await Storage.setItem(USER_BOARDS, this.cards);
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    /**
     * Filter the cards by category.
     * Returns "all" if none is specified or "All" is passed.
     */
    async filterCardsByCategory(category: string): Promise<BoardsCardItem[]> {
        try {
            await this.initializeCards();
            if (!this.cards) return [];

            if (category === "All") {
                return this.cards;
            }
            return this.cards.filter((card) => card.category === category);
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    /**
     * Remove a card by its ID.
     */
    async removeCard(cardId: number): Promise<void> {
        try {
            await this.initializeCards();
            if (!this.cards) {
                throw new Error("Cards not initialized.");
            }

            this.cards = this.cards.filter((card) => card.id !== cardId);
            await Storage.setItem(USER_BOARDS, this.cards);
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    /**
     * Reset all boards to the default `CARDS_DATA`.
     */
    async resetCards(): Promise<void> {
        try {
            console.log("Resetting Boards to default data...");
            await Storage.removeItem(USER_BOARDS);
            this.cards = [...CARDS_DATA];
            await Storage.setItem(USER_BOARDS, this.cards);
            console.log("Cards reset to initial data.");
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }
}

// Export a singleton instance if desired
const inspirationService = new InspirationService(ApiService);
export default inspirationService;
