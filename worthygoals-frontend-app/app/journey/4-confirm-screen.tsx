/**
 * Journey ④ · Confirm — the matched personality confirms in their own voice,
 * then we drop the user into the app. Persists the tone + matched mentor so the
 * new user "lands with a matched mentor + a saved tone preference" and the
 * choice survives a reload (U4 exit criteria).
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { CommonActions, ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useLocalSearchParams, useNavigation } from 'expo-router';

import { Button, MentorAvatar, Screen, Text } from '@/components/ui';
import { ROUTE_NAMES } from '@/constants/Routes';
import { personaBySlug, PersonalitySlug } from '@/constants/Personalities';
import onboardingService from '@/services/onboarding.service';
import { useAppTheme } from '@/hooks/useAppTheme';

// In-voice "will confirm" lines (Hi-Fi: picking a personality feels like signing).
const CONFIRM_LINE: Record<PersonalitySlug, string> = {
  marcus: "I've got it. See you tomorrow at 8. Don't make me come looking.",
  lyra: "I've got you. We start tomorrow — gently, but we start.",
  goggs: 'LOCKED IN. 8AM. NO SNOOZE. SEE YOU THERE.',
};

export default function ConfirmScreen() {
  const { space } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const { slug, name, mentorId } = useLocalSearchParams<{
    slug?: string;
    name?: string;
    mentorId?: string;
  }>();

  const persona = personaBySlug(slug);

  useEffect(() => {
    if (!persona) return;
    onboardingService
      .save({
        tone: persona.tone,
        mentorSlug: persona.slug,
        mentorId: mentorId ? Number(mentorId) : null,
      })
      .catch(() => {
        /* persistence is best-effort; the user can still proceed. */
      });
  }, [persona, mentorId]);

  const enter = () =>
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: ROUTE_NAMES.TABS.self }] }),
    );

  const displayName = name ?? persona?.name ?? 'Your mentor';
  const line = persona ? CONFIRM_LINE[persona.slug] : "Let's get to work.";

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <MentorAvatar mentor={slug} size={88} />
        <Text variant="eyebrow" color="primary" style={{ marginTop: space['6'] }}>
          {`${displayName.toUpperCase()} · WILL CONFIRM`}
        </Text>
        <Text
          variant="display"
          style={{ fontSize: 26, lineHeight: 34, textAlign: 'center', marginTop: space['4'] }}
        >
          {`"${line}"`}
        </Text>
      </View>

      <View style={{ paddingBottom: space['4'] }}>
        <Button label="Let's go" onPress={enter} />
      </View>
    </Screen>
  );
}
