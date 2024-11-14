import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { ROUTE_NAMES } from '@/constants/Routes';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Outfit: require('../assets/fonts/Outfit-VariableFont_wght.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name={ROUTE_NAMES.TABS.self} options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name={ROUTE_NAMES.AUTH.RESET_PASSWORD}
          options={{
            headerShown: true,
            title: 'Reset Password'
          }}
        />
        <Stack.Screen
          name={ROUTE_NAMES.AUTH.REGISTER}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name={ROUTE_NAMES.AUTH.LOGIN}
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name={ROUTE_NAMES.ENTRY_SCREEN}
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen
          name={ROUTE_NAMES.AUTH.START_AUTH}
          options={{
            headerShown: false
          }} />
      </Stack>
    </ThemeProvider>
  );
}
