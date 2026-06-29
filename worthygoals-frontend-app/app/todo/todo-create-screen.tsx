/**
 * Goal creation ① · THE ASK (Hi-Fi flow ② · screen 04, step 1/3).
 * "Convert a 6-field form into 1 field of capture." One voice-first free-text
 * field — say it like you'd say it to a friend; the AI shapes it on the next
 * screen. Reskinned onto the warm-paper ui/ primitives (U5).
 */
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

import { Button, Header, Screen, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ROUTE_NAMES } from '@/constants/Routes';

export default function TodoCreateScreen() {
  const { colors, space, radius, fonts, fontSizes } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const [raw, setRaw] = useState('');

  const canProceed = raw.trim().length >= 5;

  const goPropose = (skip?: boolean) =>
    navigation.navigate(ROUTE_NAMES.TODO.TODO_PROPOSE_SCREEN, {
      raw: raw.trim(),
      ...(skip ? { skip: 'true' } : {}),
    } as never);

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Header eyebrow="1 / 3" title="What do you want to do?" />
        <Text variant="muted" style={{ marginBottom: space['6'] }}>
          Say it like you'd say it to a friend. We'll shape it after.
        </Text>

        <TextInput
          value={raw}
          onChangeText={setRaw}
          multiline
          autoFocus
          placeholder="run a 5k three times a week before the wedding in june"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Describe your goal"
          style={{
            fontFamily: fonts.sans,
            fontSize: fontSizes.lg,
            lineHeight: fontSizes.lg * 1.45,
            color: colors.text,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
            padding: space['4'],
            minHeight: 150,
            textAlignVertical: 'top',
          }}
        />

        <View style={{ marginTop: space['8'], gap: space['1'] }}>
          <Button label="Next →" onPress={() => goPropose()} disabled={!canProceed} />
          <Button
            label="Skip — fill it in myself"
            variant="link"
            onPress={() => goPropose(true)}
            disabled={!canProceed}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
