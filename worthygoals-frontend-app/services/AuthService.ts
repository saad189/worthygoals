import { AuthTokens, ConfirmPasswordModel, ConfirmSignUpModel, LoginInfo, SignUpInfo } from "@/models";
import { ACCESS_TOKEN, ID_TOKEN, REFRESH_TOKEN } from "@/constants";
import { formatErrorMessage } from "@/helpers";
import ApiService from "./api.service";
import Storage from "@/helpers/SecureStorageUtil";
import { HttpStatusCode } from "axios";

class AuthService {
    private endpoint: string;

    constructor(private readonly apiService: ApiService) {
        this.endpoint = '/auth';
    }

    async loginUser(authInfo: LoginInfo) {
        try {
            const { data } = await this.apiService.post<AuthTokens>(`${this.endpoint}/login`, authInfo);
            const { accessToken, idToken, refreshToken } = data;

            await Promise.all([Storage.setItem(ACCESS_TOKEN, accessToken),
            Storage.setItem(ID_TOKEN, idToken), Storage.setItem(REFRESH_TOKEN, refreshToken)]);

            return true;
        }
        catch (error: any) {
            const statusCode = error.response?.data?.statusCode;

            if (statusCode === HttpStatusCode.BadRequest && error.response?.data?.message?.includes('not confirmed')) {
                return false;
            }
            throw new Error(formatErrorMessage(error));
        }
    }

    async signupUser(signupInfo: SignUpInfo) {
        try {
            await this.apiService.post(`${this.endpoint}/signup`, signupInfo);
            return true;
        }
        catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }


    async verifyEmail(verifyEmailData: ConfirmSignUpModel) {
        try {
            await this.apiService.post(`${this.endpoint}/confirm-signup`, verifyEmailData);
            return true;
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }

    }

    async resendConfirmationCodeForVerification(email: string) {
        try {
            const response = await this.apiService.post(`${this.endpoint}/confirmation-code`, { email });
            return !!response.data;
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    async sendForgotPasswordCode(email: string) {
        try {
            const response = await this.apiService.post(`${this.endpoint}/forgot-password-code`, { email });
            return !!response.data;
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }

    async confirmNewPassword(confirmPasswordModel: ConfirmPasswordModel) {
        try {
            await this.apiService.post(`${this.endpoint}/change-password`, confirmPasswordModel);
            return true;
        } catch (error: any) {
            throw new Error(formatErrorMessage(error));
        }
    }
}

const authService = new AuthService(ApiService);

export default authService;
