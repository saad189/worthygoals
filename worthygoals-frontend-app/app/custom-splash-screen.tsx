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
import { Colors } from '@/constants/Colors';
import { Palette } from '@/constants/tokens';

type Props = {
  /** Called when the mark finishes drawing, so the root layout can hand off. */
  onDone?: () => void;
};

// The splash stays on brand paper in dark mode too: it continues the native
// splash (an ink-on-paper image), and a dark one would need a dark-mode logo
// asset that doesn't exist yet.
export default function CustomSplashScreen({ onDone }: Props) {
  const { space } = useAppTheme();
  return (
    <Screen center style={{ backgroundColor: Palette.paper }}>
      <View style={{ marginBottom: space['6'] }}>
        <CradleMark size={104} animate onDone={onDone} />
      </View>
      <Text
        variant="eyebrow"
        style={{ marginBottom: space['3'], color: Colors.light.textMuted }}
      >
        {`${APP_NAME} · V1`}
      </Text>
      {/* <Text variant="display" style={{ textAlign: 'center' }}>
        {"Find someone who'll\nactually hold you to it."}
      </Text> */}
    </Screen>
  );
}
