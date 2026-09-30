import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
const isWeb = Platform.OS === "web";
// V1 ships iOS + Android only (app.json `platforms`). The web branch exists for
// `expo start --web` during development, and uses sessionStorage rather than
// localStorage so tokens do not outlive the tab: any script on the origin can
// read either, so web is never a place to keep credentials long-term.
const webStore = () => sessionStorage;

const SecureStorage = {
  /**
   * @param expiresAtMs absolute expiry, epoch milliseconds. This was a duration
   * added to Date.now(), and the one caller passed a JWT `exp` (epoch
   * *seconds*) — so the cached profile outlived its token by ~20 days.
   * Absolute makes the unit impossible to get wrong that way again.
   */
  setItem: async (key: string, value: any, expiresAtMs?: number) => {
    let dataToStore = value;
    if (expiresAtMs) dataToStore = { _data: value, _expiry: expiresAtMs };

    const stringified = JSON.stringify(dataToStore);
    if (isWeb) {
      webStore().setItem(key, stringified);
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
      item = webStore().getItem(key);
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
    } catch {
      // Unparseable means "no session", not an error: rethrowing here made a
      // single corrupt value reject every request through the axios
      // interceptor. Drop it so the next read is clean.
      await SecureStorage.removeItem(key);
      return null;
    }
  },

  removeItem: async (key: string) => {
    if (isWeb) {
      webStore().removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export default SecureStorage;
