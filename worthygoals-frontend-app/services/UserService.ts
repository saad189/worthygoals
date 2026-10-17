
import ApiService from "./api.service";
import { formatErrorMessage, setUserInStorage } from "@/helpers";
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

    async getProfile(): Promise<UserModel | null> {
        try {
            const { data } = await this.apiService.get<UserModel>(`${this.userEndPoint}/profile`);
            await setUserInStorage(data);
            return data;
        }
        catch (error: any) {
            // No response at all (offline, timeout) or a 5xx (server down):
            // rethrow as-is so callers can tell "can't reach a working server"
            // from "the server said no". Wrapping a 5xx in a plain Error made
            // login() drop signed-in users on the sign-in screen during outages.
            if (!error?.response || error.response.status >= 500) throw error;
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

    /**
     * Permanently delete the account and everything it owns (DELETE /users/me:
     * DB rows cascade, the Cognito identity and uploaded photos are removed).
     * A 404 means the account is already gone — e.g. a first attempt that
     * finished server-side after the client timed out — so it counts as done.
     */
    async deleteAccount(): Promise<void> {
        try {
            await this.apiService.delete(`${this.userEndPoint}/me`);
        } catch (error: any) {
            if (error?.response?.status === HttpStatusCode.NotFound) return;
            throw new Error(formatErrorMessage(error));
        }
    }

    /** Persist the onboarding choices (tone + matched mentor) server-side so
     *  "your mentor" and the voiced-surface tone survive a reinstall and are
     *  the single source of truth — not local AsyncStorage (S47 tone, S51a
     *  personalityId). Both fields ride the one profile PUT. */
    async updateOnboarding(choice: { tone?: string; personalityId?: string }): Promise<void> {
        try {
            await this.apiService.put(`${this.userEndPoint}/profile`, choice);
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }
}

const userService = new UserService(ApiService);

export default userService;
