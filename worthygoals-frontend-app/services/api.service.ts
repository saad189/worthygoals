import axios, { InternalAxiosRequestConfig as OriginalInternalAxiosRequestConfig, AxiosResponse, AxiosError, HttpStatusCode } from 'axios';
import { ACCESS_TOKEN, ID_TOKEN, REFRESH_TOKEN } from '@/constants';
import Storage from '@/helpers/SecureStorageUtil';
import config from '@/constants/Config';
import { clearTokens, decodeJwtToken, isTimeNearExpiry } from '@/helpers';
import { AuthTokens } from '@/models';
import { authEmitter } from '@/core';

const BASE_URL = config.apiUrl;

interface InternalAxiosRequestConfig extends OriginalInternalAxiosRequestConfig {
    _retry?: boolean;
}

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
});

/**
 *  Function to refresh the access token using the refresh token.
 * @returns {string|null} 
 */
const refreshAccessToken = async (): Promise<string | null> => {
    const [refreshToken, accessToken] = await Promise.all([
        Storage.getItem(REFRESH_TOKEN),
        Storage.getItem(ACCESS_TOKEN)
    ]);

    if (!refreshToken || !accessToken) {
        return null;
    }
    try {
        // It's important to use a separate instance or the base URL so that
        // this call is not intercepted by our interceptors.
        const { username } = decodeJwtToken(accessToken);
        const { data } = await axios.post<AuthTokens>(`${BASE_URL}/auth/refresh-token`, { username, refreshToken });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken, idToken } = data;

        await Promise.all([
            Storage.setItem(ACCESS_TOKEN, newAccessToken),
            Storage.setItem(ID_TOKEN, idToken),
            newRefreshToken ? Storage.setItem(REFRESH_TOKEN, newRefreshToken) : Promise.resolve()
        ]);

        return newAccessToken;
    } catch (error) {
        // If refresh fails, clear tokens so the app can prompt a re-login.
        authEmitter.emit('logout');
        return null;
    }
};

// Request interceptor: adds Authorization header and refreshes the token if needed.
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        let accessToken = await Storage.getItem(ACCESS_TOKEN);

        if (accessToken) {

            const { exp } = decodeJwtToken(accessToken);
            if (isTimeNearExpiry(exp)) {

                accessToken = await refreshAccessToken();
                if (!accessToken) {
                    return Promise.reject(new axios.Cancel('Session expired, please log in again.'));
                }
            }

            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error: any) => Promise.reject(error)
);

// Response interceptor: catches errors and attempts a refresh once.
apiClient.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig;
        // If the server responds with 401 and we haven't retried yet, attempt a token refresh.
        if (error.response?.status === HttpStatusCode.Unauthorized && originalRequest && !originalRequest._retry) {

            originalRequest._retry = true;

            const newAccessToken = await refreshAccessToken();

            if (newAccessToken) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient(originalRequest);
            }
        }

        if (error.response) {
            console.log('Error response data:', error.response.data);
        } else if (error.request) {
            console.log('Error request:', error.request);
            error.message = 'Could not connect to Server, check Internet Connection!';
        } else {
            console.log('Error message:', error.message);
            error.message = 'Something went wrong';
        }
        return Promise.reject(error);
    }
);

interface ApiService {
    get: <T>(url: string, params?: any) => Promise<AxiosResponse<T>>;
    post: <T>(url: string, data?: any) => Promise<AxiosResponse<T>>;
    put: <T>(url: string, data?: any) => Promise<AxiosResponse<T>>;
    delete: <T>(url: string) => Promise<AxiosResponse<T>>;
}

const ApiService: ApiService = {
    get: (url, params) => apiClient.get(url, { params }),
    post: (url, data) => apiClient.post(url, data),
    put: (url, data) => apiClient.put(url, data),
    delete: (url) => apiClient.delete(url),
};

export default ApiService;
