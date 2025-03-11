import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { View } from 'react-native';
import { RootSiblingParent } from 'react-native-root-siblings';
import { useColorScheme } from '@/components/useColorScheme';
import { ROUTE_NAMES } from '@/constants/Routes';
import CustomSplashScreen from './custom-splash-screen';
import { AuthProvider, LoaderProvider, ToastProvider, useAuth } from '@/hooks';


export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Outfit: require('../assets/fonts/Outfit-VariableFont_wght.ttf'),
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
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {isSplashVisible || !loaded ? <CustomSplashScreen /> : <RootLayoutNav />}
    </View>
  );
}


function ProtectedRoutes() {
  return (
    <Stack>
      <Stack.Screen name={ROUTE_NAMES.TABS.self} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTE_NAMES.JOURNEY.self} options={{ headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name={ROUTE_NAMES.GOAL_SELECTION.self} options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      <Stack.Screen name={ROUTE_NAMES.CHAT.self} options={{ animation: 'slide_from_right', headerShown: false }} />
      <Stack.Screen
        name={`${ROUTE_NAMES.PROFILE.self}/${ROUTE_NAMES.PROFILE.REGISTER_PROFILE}`}
        options={{
          headerLeft: () => <View />,
          title: ' Register Profile'
        }}
      />
    </Stack>
  );
}

function OpenRoutes() {
  return (
    <Stack>
      <Stack.Screen name={ROUTE_NAMES.AUTH.self} options={{ headerShown: false }} />

      <Stack.Screen
        name={ROUTE_NAMES.ENTRY_SCREEN}
        options={{
          headerShown: false
        }}
      />
    </Stack>);
}

function Stacks() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {!isAuthenticated && (
        <Redirect href={{ pathname: ROUTE_NAMES.AUTH.self as any, params: { screen: ROUTE_NAMES.AUTH.LOGIN } }} />
      )}
      {isAuthenticated ? <ProtectedRoutes /> : <OpenRoutes />}
    </>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootSiblingParent>
        <AuthProvider>
          <ToastProvider>
            <LoaderProvider>
              <Stacks />
            </LoaderProvider>
          </ToastProvider>
        </AuthProvider>
      </RootSiblingParent>
    </ThemeProvider>
  );
}