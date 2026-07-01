/**
 * Boot splash — the brief brand moment while the root layout settles.
 * Warm paper + the editorial promise (the register of Hi-Fi screen 01).
 * Navigation isn't mounted yet, so this stays static — the two doors
 * (get started / sign in) live on auth/start-auth.
 */
import React from 'react';
import { Screen, Text } from '@/components/ui';
import { APP_NAME } from '@/constants/Brand';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function CustomSplashScreen() {
  const { space } = useAppTheme();
  return (
    <Screen center>
      <Text variant="eyebrow" style={{ marginBottom: space['3'] }}>
        {`${APP_NAME} · V1`}
      </Text>
      <Text variant="display" style={{ textAlign: 'center' }}>
        {"Find someone who'll\nactually hold you to it."}
      </Text>
    </Screen>
  );
}
