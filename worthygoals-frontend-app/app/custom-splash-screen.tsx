/**
 * Boot splash — the brief brand moment while the root layout settles.
 * Warm paper + the animated Cradle mark, then the editorial promise (the
 * register of Hi-Fi screen 01). The native splash (static mark on paper) hands
 * off to this screen, which continues it by drawing the mark on. Navigation
 * isn't mounted yet, so this stays static — the two doors (get started / sign
 * in) live on auth/start-auth.
 */
import React from 'react';
import { View } from 'react-native';
import { Screen, Text } from '@/components/ui';
import CradleMark from '@/components/brand/CradleMark';
import { APP_NAME } from '@/constants/Brand';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  /** Called when the mark finishes drawing, so the root layout can hand off. */
  onDone?: () => void;
};

export default function CustomSplashScreen({ onDone }: Props) {
  const { space } = useAppTheme();
  return (
    <Screen center>
      <View style={{ marginBottom: space['6'] }}>
        <CradleMark size={104} animate onDone={onDone} />
      </View>
      <Text variant="eyebrow" style={{ marginBottom: space['3'] }}>
        {`${APP_NAME} · V1`}
      </Text>
      {/* <Text variant="display" style={{ textAlign: 'center' }}>
        {"Find someone who'll\nactually hold you to it."}
      </Text> */}
    </Screen>
  );
}
