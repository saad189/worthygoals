/**
 * Journey ② · Tone test — the forced-choice deck (Hi-Fi screen 02).
 * "Which lands harder when you slip?" A single deck card with two framings of
 * the same slip — quiet (left) or loud (right, in the accent) — over a stack of
 * rotated hint cards. Pick one; the tally feeds the personality match (Q3 — the
 * tone preference, soft-by-default). Tap-to-choose; a swipe gesture layer is a
 * later polish pass. Step-dots + counter sit at the top (S44 fidelity pass).
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Button, Screen, StepDots, Text } from '@/components/ui';
import { ROUTE_NAMES } from '@/constants/Routes';
import { TONE_TEST_CARDS } from '@/constants/Personalities';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ToneTestScreen() {
  const { colors, space, radius, fonts } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const [index, setIndex] = useState(0);
  const [hardCount, setHardCount] = useState(0);

  const total = TONE_TEST_CARDS.length;
  const card = TONE_TEST_CARDS[index];

  const finish = (hard: number, answered: number) =>
    navigation.navigate(ROUTE_NAMES.JOURNEY.YOUR_TEAM_SCREEN, {
      hard: String(hard),
      answered: String(answered),
    } as never);

  const choose = (isHard: boolean) => {
    const nextHard = hardCount + (isHard ? 1 : 0);
    const answered = index + 1;
    if (answered >= total) {
      finish(nextHard, answered);
      return;
    }
    setHardCount(nextHard);
    setIndex(answered);
  };

  return (
    <Screen>
      <View style={styles.stepRow}>
        <StepDots total={total} active={index} />
        <Text variant="mono">{`${index + 1} / ${total}`}</Text>
      </View>

      <Text variant="title" style={styles.question}>
        {'Which lands harder\nwhen you slip?'}
      </Text>

      <View style={styles.deck}>
        {/* Stack hints behind the live card. */}
        <View
          style={[
            styles.hint,
            { backgroundColor: colors.canvas, borderColor: colors.border, transform: [{ rotate: '-1.5deg' }] },
          ]}
        />
        <View
          style={[
            styles.hint,
            { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ rotate: '0.8deg' }] },
          ]}
        />

        {/* Live card. */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            style={[styles.choice, { backgroundColor: colors.canvas, borderColor: colors.border }]}
            onPress={() => choose(false)}
            accessibilityRole="button"
            accessibilityLabel={`Quiet: ${card.soft}`}
          >
            <Text variant="mono">← LEFT</Text>
            <Text variant="display" style={styles.softLine}>
              {`"${card.soft}"`}
            </Text>
            <Text variant="muted" style={styles.caption}>
              Quiet &amp; landed. The slow burn.
            </Text>
          </Pressable>

          <Text variant="display" style={[styles.or, { color: colors.textMuted }]}>
            or
          </Text>

          <Pressable
            style={[styles.choice, { backgroundColor: colors.primarySubtle, borderColor: colors.primary }]}
            onPress={() => choose(true)}
            accessibilityRole="button"
            accessibilityLabel={`Loud: ${card.hard}`}
          >
            <Text variant="mono" color="primary">
              RIGHT →
            </Text>
            <Text
              style={{
                fontFamily: fonts.mono,
                fontWeight: '700',
                fontSize: 20,
                lineHeight: 24,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: colors.primary,
              }}
            >
              {card.hard}
            </Text>
            <Text variant="muted" color="primary" style={styles.caption}>
              Loud &amp; in your face. The shove.
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <Text variant="mono">tap a side to choose</Text>
        <Button
          label="Skip — just pick for me"
          variant="link"
          onPress={() => finish(hardCount, index)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  question: { fontSize: 26, lineHeight: 32, letterSpacing: -0.5, marginBottom: 18 },
  deck: { flex: 1, position: 'relative', marginVertical: 8 },
  hint: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 12,
    right: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  card: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 14,
  },
  choice: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'flex-start',
  },
  softLine: { fontSize: 22, lineHeight: 26, marginTop: 8 },
  caption: { marginTop: 'auto', fontStyle: 'italic' },
  or: { fontSize: 16, textAlign: 'center' },
  footer: { paddingTop: 12, paddingBottom: 4, alignItems: 'center', gap: 4 },
});
