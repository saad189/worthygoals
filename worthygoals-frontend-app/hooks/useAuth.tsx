// AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import Storage from "@/helpers/SecureStorageUtil";
import { ID_TOKEN, ROUTE_NAMES } from "@/constants";
import { clearTokens, decodeJwtToken, getUserLocationAsync } from "@/helpers";
import { CommonActions, ParamListBase } from "@react-navigation/native";

import { authEmitter } from "@/core";
import { queryClient } from "@/core/queryClient";
import onboardingService from "@/services/onboarding.service";
import { LocationCoordinates, UserModel } from "@/models";
import { StackNavigationProp } from "@react-navigation/stack";
import { router, useNavigation } from "expo-router";
import userService from "@/services/UserService";
import { syncPushToken, unregisterPushToken } from "@/services/push.service";
import { useToast } from "./useToastNotification";

interface AuthContextProps {
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
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
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const [userProfile, setUserProfile] = useState<Partial<UserModel> | null>(
    null
  );
  const { showInfoMessage } = useToast();

  // Create a custom Navigator that will be used throughout the app, so that it checks for routes and roles
  // On app start, check if tokens exist

  const [userLocation, setUserLocation] = useState<
    LocationCoordinates | undefined
  >(undefined);

  // const getUserLocation = async () => {
  //     const location = await getUserLocationAsync();
  //     setUserLocation(location);
  // }

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

  const logout = async () => {
    // Deactivate the token server-side while we still hold a valid access token.
    await unregisterPushToken();
    await clearTokens();
    // Drop everything user-scoped so the next account on this device can't
    // rehydrate the previous user's data: the persisted query cache
    // (WG_QUERY_CACHE — dashboard/tasks/goals/board/profile) and onboarding.
    queryClient.clear();
    await onboardingService.reset();
    setIsAuthenticated(false);
    showInfoMessage("Logged out!");
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: ROUTE_NAMES.AUTH.self }],
      })
    );
    navigation.replace(ROUTE_NAMES.AUTH.LOGIN);
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
