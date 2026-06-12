
import ApiService from "./api.service";
import { formatErrorMessage, getUserInStorage, setUserInStorage } from "@/helpers";
import { CreateUserModel, UserModel } from "@/models";
import { HttpStatusCode } from "axios";

class UserService {
    private userEndPoint: string;
    private userConfigEndPoint: string;

    constructor(private readonly apiService: ApiService) {
        this.userEndPoint = '/users';
        this.userConfigEndPoint = '/user-deed-configs';
    }

    async createProfile(profileData: CreateUserModel): Promise<UserModel> {
        try {
            const { data } = await this.apiService.post<UserModel>(this.userEndPoint, profileData);
            await setUserInStorage(data);
            return data;
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    // async createConfig(userId: number): Promise<any> {
    //     try {
    //         const { data } = await this.apiService.post<any>(`${this.userConfigEndPoint}/user/${userId}`);
    //         return data;
    //     } catch (error: any) {
    //         throw new Error(formatErrorMessage(error));
    //     }
    // }

    async getUserProfile(): Promise<UserModel | null> {
        const user = await getUserInStorage();
        return user ? user : this.getProfile();
    }

    async getProfile(): Promise<UserModel | null> {
        try {
            const { data } = await this.apiService.get<UserModel>(`${this.userEndPoint}/profile`);
            await setUserInStorage(data);
            return data;
        }
        catch (error: any) {
            const statusCode = error.response?.data?.statusCode;

            if (statusCode === HttpStatusCode.NotFound && error.response?.data?.message?.includes('not found')) {
                return null;
            }

            throw new Error(formatErrorMessage(error));
        }
    }

    async updateProfile(profileData: UserModel): Promise<UserModel> {
        try {
            // Send only UpdateUserDto fields — the backend ValidationPipe
            // (forbidNonWhitelisted) rejects extras like id/role/age.
            const allowed = [
                'email', 'firstName', 'lastName', 'dateOfBirth',
                'gender', 'latitude', 'longitude',
            ] as const;
            const payload: Record<string, unknown> = {};
            for (const key of allowed) {
                const value = (profileData as unknown as Record<string, unknown>)[key];
                if (value !== undefined) payload[key] = value;
            }
            const { data } = await this.apiService.put<UserModel>(`${this.userEndPoint}/profile`, payload);
            await setUserInStorage(data);
            return data;
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }
}

const userService = new UserService(ApiService);

export default userService;
