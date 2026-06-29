/**
 * Journey ① · Intro — opens the personality-match funnel (Hi-Fi flow ①).
 * Warm-light, primitives only. Sets the editorial register before the
 * forced-choice tone test.
 */
import React from 'react';
import { View } from 'react-native';
import { useNavigation } from 'expo-router';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Button, Header, MentorAvatar, Screen, Text } from '@/components/ui';
import { APP_NAME } from '@/constants/Brand';
import { ROUTE_NAMES } from '@/constants/Routes';
import { PERSONALITIES } from '@/constants/Personalities';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function IntroScreen() {
  const { space } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const start = () => navigation.navigate(ROUTE_NAMES.JOURNEY.TONE_TEST_SCREEN);
  const skip = () =>
    navigation.navigate(ROUTE_NAMES.JOURNEY.YOUR_TEAM_SCREEN, { hard: '0', answered: '0' } as never);

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Header
          eyebrow={`${APP_NAME} · SETUP`}
          title={"Let's find the voice\nyou can't ignore."}
        />
        <Text variant="muted" style={{ marginBottom: space['8'] }}>
          Three coaches, one stake. Answer a few quick gut-checks and we'll match
          you with the one you'll actually listen to.
        </Text>

        <View style={{ flexDirection: 'row', gap: space['3'] }}>
          {PERSONALITIES.map((p) => (
            <MentorAvatar key={p.slug} mentor={p.slug} size={52} />
          ))}
        </View>
      </View>

      <View style={{ paddingBottom: space['4'] }}>
        <Button label="Start" onPress={start} />
        <Button label="Skip — just pick for me" variant="link" onPress={skip} />
      </View>
    </Screen>
  );
}
