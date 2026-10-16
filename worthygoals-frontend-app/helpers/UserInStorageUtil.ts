import { ACCESS_TOKEN, USER_CREDENTIALS, USER_PROFILE } from "@/constants";
import SecureStorage from "@/helpers/SecureStorageUtil";
import { RememberLoginInfo, UserModel } from "@/models";

import { jwtDecode } from "jwt-decode";

const EMPTY_REMEMBERED: RememberLoginInfo = { email: "", rememberMe: false };

/**
 * Persist what "remember me" needs: the email to prefill, nothing more.
 *
 * The storage key is deliberately unchanged from when this stored the
 * plaintext password — writing to the same key is what overwrites that value
 * on devices that already have it.
 */
export const rememberSignIn = async (remembered: RememberLoginInfo) => {
  try {
    await SecureStorage.setItem(USER_CREDENTIALS, remembered);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Read the remembered email. Any value still in the old
 * `{ loginInfo: { email, password }, rememberMe }` shape is rewritten in place
 * without the password, so existing installs are purged on first read rather
 * than carrying it until the user happens to log in again.
 */
export const getRememberedSignIn = async (): Promise<RememberLoginInfo> => {
  try {
    const stored = await SecureStorage.getItem(USER_CREDENTIALS);
    if (!stored) return EMPTY_REMEMBERED;

    if ("loginInfo" in stored) {
      const migrated: RememberLoginInfo = {
        email: stored.loginInfo?.email ?? "",
        rememberMe: !!stored.rememberMe,
      };
      await rememberSignIn(migrated);
      return migrated;
    }

    return { email: stored.email ?? "", rememberMe: !!stored.rememberMe };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const forgetRememberedSignIn = async () => {
  try {
    await SecureStorage.removeItem(USER_CREDENTIALS);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const setUserInStorage = async (user: UserModel) => {
  try {
    const accessToken = await SecureStorage.getItem(ACCESS_TOKEN);
    const exp = jwtDecode(accessToken).exp;
    await SecureStorage.setItem(USER_PROFILE, user, exp ? exp * 1000 : undefined);
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
