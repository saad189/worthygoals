import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Theme as NavTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Redirect, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { RootSiblingParent } from "react-native-root-siblings";
import { PostHogProvider } from "posthog-react-native";
import { useColorScheme } from "@/components/useColorScheme";
import { ROUTE_NAMES } from "@/constants/Routes";
import { Colors } from "@/constants";
import CustomSplashScreen from "./custom-splash-screen";
import { AuthProvider, LoaderProvider, ToastProvider, useAuth } from "@/hooks";
import Background from "@/components/SubComponents/Background";
import { initSentry, SentryWrap, POSTHOG_KEY } from "@/services/observability";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, asyncStoragePersister } from "@/core/queryClient";
import { useOutboxDrain } from "@/hooks/useOutboxDrain";

initSentry();

// PostHog is optional — without a key, render children with no provider.
function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  if (!POSTHOG_KEY) return <>{children}</>;
  return (
    <PostHogProvider apiKey={POSTHOG_KEY} options={{ host: 'https://us.i.posthog.com' }}>
      {children}
    </PostHogProvider>
  );
}

// Flushes the offline task outbox; must live inside the query provider.
function OutboxDrainer() {
  useOutboxDrain();
  return null;
}

/**
 * Build a React Navigation theme that maps WG semantic tokens
 * onto the navigator's colour slots.  Every Stack/Tabs navigator
 * in the app inherits these colours automatically.
 */
function buildNavTheme(scheme: 'light' | 'dark'): NavTheme {
  const c = Colors[scheme];
  return {
    dark: scheme === 'dark',
    colors: {
      primary:      c.tint,
      background:   c.background,
      card:         c.surface,
      text:         c.text,
      border:       c.border,
      notification: c.tint,
    },
  };
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [loaded, error] = useFonts({
    // Brand fonts (E-4) — registered family names match constants/tokens.ts FontFamily.
    Geist: require("../assets/fonts/Geist.ttf"),
    Newsreader: require("../assets/fonts/Newsreader.ttf"),
    "Newsreader-Italic": require("../assets/fonts/Newsreader-Italic.ttf"),
    "JetBrains Mono": require("../assets/fonts/JetBrainsMono.ttf"),
    // Legacy — kept registered until the reskin sweep (U3–U8) removes the last refs.
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Outfit: require("../assets/fonts/Outfit-VariableFont_wght.ttf"),
    ...FontAwesome.font,
  });

  const [isSplashVisible, setIsSplashVisible] = useState(true);

  // // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    // Simulate splash screen duration (e.g., 3 seconds)
    const timer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 320); // Adjust duration as needed

    if (loaded) {
      SplashScreen.hideAsync();
    }
    return () => clearTimeout(timer); // Cleanup timer
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    // GestureHandlerRootView must wrap the whole tree: @gorhom/bottom-sheet
    // (CompletionSheet / ExplanationSheet) drives gesture handlers in the main
    // navigation tree, which crash without a root provider (E-1).
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Background style={{ flex: 1 }}>
        {isSplashVisible || !loaded ? <CustomSplashScreen /> : <RootLayoutNav />}
      </Background>
    </GestureHandlerRootView>
  );
}

function Routes() {
  return (
    <Stack>
      <Stack.Screen
        name={ROUTE_NAMES.AUTH.self}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name={ROUTE_NAMES.ENTRY_SCREEN}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.TABS.self}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.JOURNEY.self}
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.GOAL_SELECTION.self}
        options={{ headerShown: false, animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen
        name={ROUTE_NAMES.CHAT.self}
        options={{ animation: "slide_from_right", headerShown: false }}
      />

      <Stack.Screen
        name={ROUTE_NAMES.MENTORS.self}
        options={{ animation: "slide_from_right", headerShown: false }}
      />

      <Stack.Screen
        name={ROUTE_NAMES.TODO.self}
        options={{ animation: "slide_from_right", headerShown: false }}
      />
      <Stack.Screen
        name={`${ROUTE_NAMES.PROFILE.self}/${ROUTE_NAMES.PROFILE.REGISTER_PROFILE}`}
        options={{
          headerLeft: () => <View />,
          title: " Register Profile",
        }}
      />
    </Stack>
  );
}

function Stacks() {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const allowedRoutes = [ROUTE_NAMES.AUTH.self];

  return (
    <>
      {!isAuthenticated &&
        segments.length > 0 &&
        !allowedRoutes.includes(segments[0]) && (
          <Redirect
            href={{
              pathname: ROUTE_NAMES.AUTH.self as any,
              params: { screen: ROUTE_NAMES.AUTH.START_AUTH },
            }}
          />
        )}
      <Routes />
    </>
  );
}

function RootLayoutNav() {
  const scheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const navTheme = buildNavTheme(scheme);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <OutboxDrainer />
      <AnalyticsProvider>
        <ThemeProvider value={navTheme}>
          <RootSiblingParent>
            <ToastProvider>
              <AuthProvider>
                <LoaderProvider>
                  <Stacks />
                </LoaderProvider>
              </AuthProvider>
            </ToastProvider>
          </RootSiblingParent>
        </ThemeProvider>
      </AnalyticsProvider>
    </PersistQueryClientProvider>
  );
}

export default SentryWrap(RootLayout);
