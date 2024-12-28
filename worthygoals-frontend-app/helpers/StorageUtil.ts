import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';
// secure local storage later

const Storage = {
    setItem: async (key: string, value: any) => {
        if (isWeb) {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            await SecureStore.setItemAsync(key, JSON.stringify(value));
        }
    },
    getItem: async (key: string) => {
        if (isWeb) {
            const item = localStorage.getItem(key);
            if (item) {
                return await JSON.parse(item);
            }
            return null;
        } else {
            const item = await SecureStore.getItemAsync(key);
            return item ? await JSON.parse(item) : null;
        }
    },
    removeItem: async (key: string) => {
        if (isWeb) {
            localStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    }
};

export default Storage;
