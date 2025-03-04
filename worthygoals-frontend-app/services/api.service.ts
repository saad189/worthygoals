import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

import Storage from '@/helpers/SecureStorageUtil';
import config from '@/constants/Config';
import { AUTH_TOKEN } from '@/constants';

const BASE_URL = config.apiUrl;

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
});

// Request interceptor to add the Authorization header
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        const token = await Storage.getItem(AUTH_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle responses or errors
apiClient.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    (error: AxiosError) => {
        console.log({ error, ERRORRESPONSE: error.response, ERROREQUEST: error.request })
        if (error.response) {
            // Server responded with a status code other than 2xx
            console.log('Error response data:', error.response.data);

        } else if (error.request) {
            // Request was made but no response was received
            console.log('Error request:', error.request);
            error.message = 'Could not connect to Server, check Internet Connection!';
        } else {
            // Something happened in setting up the request

            console.log('Error message:', error.message);
            error.message = 'Something went wrong'
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
    get: (url, params) => {
        return apiClient.get(url, { params })
    },
    post: (url, data) => apiClient.post(url, data),
    put: (url, data) => apiClient.put(url, data),
    delete: (url) => apiClient.delete(url),
};

export default ApiService;
