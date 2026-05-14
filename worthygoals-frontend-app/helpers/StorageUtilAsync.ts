import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const isWeb = Platform.OS === 'web';

const Storage = {
    setItem: async (key: string, value: any, expiry?: number) => {
        let dataToStore = value;
        if (expiry)
            dataToStore = { _data: value, _expiry: Date.now() + expiry };

        const stringified = JSON.stringify(dataToStore);
        if (isWeb) {
            localStorage.setItem(key, stringified);
        } else {
            await AsyncStorage.setItem(key, stringified);
        }
    },

    /**
     * Retrieve an item and check if it is expired.
     */
    getItem: async (key: string) => {
        let item: string | null;
        if (isWeb) {
            item = localStorage.getItem(key);
        } else {
            item = await AsyncStorage.getItem(key);
        }
        if (!item) return null;

        try {
            const parsed = JSON.parse(item);
            if (parsed && typeof parsed === 'object' && parsed._expiry) {
                if (Date.now() > parsed._expiry) {
                    await Storage.removeItem(key);
                    return null;
                }
                return parsed._data;
            }
            return parsed;
        } catch (e) {
            // In case parsing fails, return null.
            throw new Error('Failed to Parse Data: ' + (e as any).message);
        }
    },

    removeItem: async (key: string) => {
        if (isWeb) {
            localStorage.removeItem(key);
        } else {
            await AsyncStorage.removeItem(key);
        }
    }
};

export default Storage;
