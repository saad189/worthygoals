/**
 * Auth entry — Hi-Fi screen 01 (SPLASH): the promise, the name, two doors.
 * "Italic serif sets the editorial register before mentor copy lands."
 */
import React from 'react';
import { View } from 'react-native';
import { useNavigation } from 'expo-router';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Button, Header, MentorAvatar, Screen, Text } from '@/components/ui';
import { APP_NAME } from '@/constants/Brand';
import { PERSONALITIES } from '@/constants/Personalities';
import { ROUTE_NAMES } from '@/constants/Routes';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function StartScreen() {
  const { space } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Header
          eyebrow={`${APP_NAME} · V1`}
          title={"Find someone who'll\nactually hold you to it."}
        />
        <Text variant="muted" style={{ marginBottom: space['8'] }}>
          Three coaches. One stake. A spine when yours is tired. Pick the voice
          you can't ignore.
        </Text>
        <View style={{ flexDirection: 'row', gap: space['3'] }}>
          {PERSONALITIES.map((p) => (
            <MentorAvatar key={p.slug} mentor={p.slug} size={52} />
          ))}
        </View>
      </View>

      <View style={{ paddingBottom: space['4'] }}>
        <Button
          label="Get started"
          onPress={() => navigation.navigate(ROUTE_NAMES.AUTH.REGISTER)}
        />
        <Button
          label="I already have an account"
          variant="link"
          onPress={() => navigation.navigate(ROUTE_NAMES.AUTH.LOGIN)}
        />
      </View>
    </Screen>
  );
}
