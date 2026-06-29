/**
 * Journey ② · Tone test — the forced-choice deck (Hi-Fi screen 02).
 * "Which lands harder when you slip?" One card at a time: pick the quiet
 * framing or the loud one. The tally feeds the personality match (Q3 — the
 * tone preference, soft-by-default). Tap-to-choose rather than swipe; a swipe
 * gesture layer is a later polish pass.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from 'expo-router';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Button, Card, Header, Screen, Text } from '@/components/ui';
import { ROUTE_NAMES } from '@/constants/Routes';
import { TONE_TEST_CARDS } from '@/constants/Personalities';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function ToneTestScreen() {
  const { colors, space, radius } = useAppTheme();
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
      <Header eyebrow={`${index + 1} / ${total}`} title={'Which lands harder\nwhen you slip?'} />

      <View style={{ flex: 1, justifyContent: 'center', gap: space['4'] }}>
        <Card onPress={() => choose(false)}>
          <Text variant="display" style={{ fontSize: 24, lineHeight: 30 }}>
            {`"${card.soft}"`}
          </Text>
          <Text variant="eyebrow" style={{ marginTop: space['3'] }}>
            QUIET · THE SLOW BURN
          </Text>
        </Card>

        <Card
          onPress={() => choose(true)}
          style={{ borderColor: colors.primary, backgroundColor: colors.primarySubtle }}
        >
          <Text variant="title" color="primary">
            {card.hard}
          </Text>
          <Text variant="eyebrow" color="primary" style={{ marginTop: space['3'] }}>
            LOUD · THE SHOVE
          </Text>
        </Card>
      </View>

      <View style={{ paddingBottom: space['4'] }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: space['2'],
            marginBottom: space['4'],
          }}
        >
          {TONE_TEST_CARDS.map((_, i) => (
            <View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: radius.pill,
                backgroundColor: i <= index ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>
        <Button
          label="Skip — just pick for me"
          variant="link"
          onPress={() => finish(hardCount, index)}
        />
      </View>
    </Screen>
  );
}
