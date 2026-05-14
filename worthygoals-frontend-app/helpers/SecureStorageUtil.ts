import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
const isWeb = Platform.OS === "web";
// Warning! Not recommended for Web Storage, as it doesn't securely store the credentials!

const SecureStorage = {
  setItem: async (key: string, value: any, expiry?: number) => {
    let dataToStore = value;
    if (expiry) dataToStore = { _data: value, _expiry: Date.now() + expiry };

    const stringified = JSON.stringify(dataToStore);
    if (isWeb) {
      localStorage.setItem(key, stringified);
    } else {
      await SecureStore.setItemAsync(key, stringified);
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
      item = await SecureStore.getItemAsync(key);
    }
    if (!item) return null;

    try {
      const parsed = JSON.parse(item);
      if (parsed && typeof parsed === "object" && parsed._expiry) {
        if (Date.now() > parsed._expiry) {
          await SecureStorage.removeItem(key);
          return null;
        }
        return parsed._data;
      }
      return parsed;
    } catch (e) {
      // In case parsing fails, return null.
      throw new Error("Failed to Parse Data: " + (e as any).message);
    }
  },

  removeItem: async (key: string) => {
    if (isWeb) {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export default SecureStorage;
