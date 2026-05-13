import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Theme as NavTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

/**
 * Worthy Goals navigation theme — maps React Navigation's semantic
 * colour slots onto our design tokens so every navigator (Stack, Tabs,
 * Drawer) inherits the WG palette automatically.
 */
function buildNavTheme(scheme: 'light' | 'dark'): NavTheme {
  const c = Colors[scheme];
  return {
    dark: scheme === 'dark',
    colors: {
      primary: c.tint,           // active tint / links
      background: c.background,  // screen background
      card: c.surface,           // header / tab bar surface
      text: c.text,              // header title + labels
      border: c.border,          // separator lines
      notification: c.tint,      // badge / notification dot
    },
  };
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // SpaceMono kept until Geist/JetBrains/Newsreader are added via expo-font in Phase 0
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme() ?? 'light';
  const navTheme = buildNavTheme(colorScheme);

  return (
    <ThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
