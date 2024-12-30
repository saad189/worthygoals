import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
const isWeb = Platform.OS === 'web';

const Storage = {
    setItem: async (key: string, value: any) => {
        if (isWeb) {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            await AsyncStorage.setItem(key, JSON.stringify(value));
        }
    },
    getItem: async (key: string) => {
        if (isWeb) {
            const item = localStorage.getItem(key);
            if (item) {
                return JSON.parse(item);
            }
            return null;
        } else {
            const item = await AsyncStorage.getItem(key);
            return item ? JSON.parse(item) : null;
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
