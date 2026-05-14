import { ACCESS_TOKEN, USER_CREDENTIALS, USER_PROFILE } from "@/constants";
import SecureStorage from "@/helpers/SecureStorageUtil";
import { RememberLoginInfo, UserModel } from "@/models";

import { jwtDecode } from "jwt-decode";

export const rememberUserCredentials = async (
  credentials: RememberLoginInfo,
  expiry?: number
) => {
  try {
    await SecureStorage.setItem(USER_CREDENTIALS, credentials, expiry);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Retrieve the stored credentials.
 */
export const getRememberedUserCredentials =
  async (): Promise<RememberLoginInfo> => {
    try {
      const credentials = await SecureStorage.getItem(USER_CREDENTIALS);

      return (
        credentials || {
          loginInfo: { email: "", password: "" },
          rememberMe: false,
        }
      );
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

export const forgetUserCredentials = async () => {
  try {
    await SecureStorage.removeItem(USER_CREDENTIALS);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const setUserInStorage = async (user: UserModel) => {
  try {
    const accessToken = await SecureStorage.getItem(ACCESS_TOKEN);
    await SecureStorage.setItem(USER_PROFILE, user, jwtDecode(accessToken).exp);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getUserInStorage = async (): Promise<UserModel | null> => {
  try {
    const user = await SecureStorage.getItem(USER_PROFILE);
    return user || null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
