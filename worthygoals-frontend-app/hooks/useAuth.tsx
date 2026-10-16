// AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import Storage from "@/helpers/SecureStorageUtil";
import { ID_TOKEN, ROUTE_NAMES } from "@/constants";
import { clearTokens, decodeJwtToken } from "@/helpers";

import { authEmitter } from "@/core";
import { asyncStoragePersister, queryClient } from "@/core/queryClient";
import onboardingService from "@/services/onboarding.service";
import { LocationCoordinates, UserModel } from "@/models";
import { router } from "expo-router";
import userService from "@/services/UserService";
import { syncPushToken, unregisterPushToken } from "@/services/push.service";
import { useToast } from "./useToastNotification";

interface AuthContextProps {
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuthenticated: (value: boolean) => void;
  userProfile: Partial<UserModel> | null;
  userLocation?: LocationCoordinates;
  setUserProfile: (value: Partial<UserModel>) => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<Partial<UserModel> | null>(
    null
  );
  const { showInfoMessage, showErrorMessage } = useToast();

  // Create a custom Navigator that will be used throughout the app, so that it checks for routes and roles
  // On app start, check if tokens exist

  const [userLocation, setUserLocation] = useState<
    LocationCoordinates | undefined
  >(undefined);


  const checkAuth = async () => {
    const token = await Storage.getItem(ID_TOKEN);

    if (!token) return false;

    const { email } = decodeJwtToken(token);
    if (!email) throw new Error("Email is undefined in the token");

    await login(email);
    return true;
  };

  useEffect(() => {
    const logoutHandler = () => {
      logout();
      console.log("Log out event by Token outdate!");
    };
    authEmitter.on("logout", logoutHandler);
    return () => {
      authEmitter.off("logout", logoutHandler);
    };
  }, []);

  const login = async (email: string) => {
    setUserProfile({ email });

    // The profile fetch is awaited before isAuthenticated is committed.
    // Setting the flag first meant a rejection here left the user "logged in"
    // while app/index.tsx recovered the rejection and routed to start-auth —
    // the Stacks() guard never corrects that direction, and login.tsx
    // suppresses its remembered-email prefill whenever isAuthenticated is
    // true, so the sign-in screen read as a first launch.
    const profile = await userService.getProfile();

    if (profile) setUserProfile(profile);

    // Committed before navigating, not after: the Stacks() guard redirects
    // away from any non-auth route while this is false.
    setIsAuthenticated(true);

    // Re-sync this device's push token silently — never prompt at login; a new
    // user gets asked after their first completion (see useCompleteTask).
    void syncPushToken({ prompt: false });

    // expo-router: navigate to tab screens by path via `router` (react-nav's
    // navigate('(tabs)', {screen}) doesn't resolve the group). `replace` drops
    // the auth stack so Back can't return to login.
    router.replace(
      profile
        ? (`/${ROUTE_NAMES.TABS.self}/${ROUTE_NAMES.TABS.HOME_SCREEN}` as never)
        : (`/${ROUTE_NAMES.PROFILE.self}/${ROUTE_NAMES.PROFILE.REGISTER_PROFILE}` as never)
    );
  };

  /**
   * Sign out.
   *
   * Every step here is best-effort and independent. Previously all three
   * awaits were unguarded, so one rejection — a keychain error, an offline
   * device — skipped the cache clear, the state change, the toast and all
   * navigation, leaving the user signed in with tokens partially cleared and
   * no indication anything had happened. The context typed this `() => void`
   * while it was async, so no caller could have noticed.
   *
   * A failure to clear tokens is reported rather than swallowed: leaving
   * credentials on the device is exactly what sign-out is for.
   */
  const logout = async (): Promise<void> => {
    // Deactivate the token server-side while we still hold a valid access
    // token. Never blocking: the server-side row going stale is recoverable,
    // a user stuck signed in is not.
    try {
      await unregisterPushToken();
    } catch (error) {
      console.warn("Could not unregister push token:", error);
    }

    let tokensCleared = true;
    try {
      await clearTokens();
    } catch (error) {
      tokensCleared = false;
      console.error("Could not clear stored tokens:", error);
    }

    // Drop everything user-scoped so the next account on this device can't
    // rehydrate the previous user's data: the persisted query cache
    // (WG_QUERY_CACHE) and onboarding.
    //
    // queryClient.clear() alone only empties memory and relies on the
    // persister's throttled write to catch up — if the app is killed first,
    // the previous user's cache is still on disk at next launch. removeClient()
    // deletes the stored copy outright.
    queryClient.clear();
    try {
      await asyncStoragePersister.removeClient();
    } catch (error) {
      console.warn('Could not remove the persisted query cache:', error);
    }
    try {
      await onboardingService.reset();
    } catch (error) {
      console.warn("Could not reset onboarding state:", error);
    }

    setUserProfile(null);
    setIsAuthenticated(false);

    if (tokensCleared) {
      showInfoMessage("Logged out!");
    } else {
      showErrorMessage(
        "Signed out, but your saved credentials could not be removed from this device.",
      );
    }

    // Navigation is the Stacks() guard's job — flipping isAuthenticated
    // renders its <Redirect>. The two imperative calls that used to follow
    // raced it, and navigation.replace('login') named a route that is not
    // root-level.
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        setAuthenticated: setIsAuthenticated,
        userProfile,
        setUserProfile,
        checkAuth,
        userLocation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
