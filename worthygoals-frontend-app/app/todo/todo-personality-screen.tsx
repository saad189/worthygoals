/**
 * Goal creation ③ · SIGN THE CONTRACT (Hi-Fi flow ② · screen 06, step 3/3).
 * "Who's going to hold you to this?" Picking a personality should feel like
 * signing — the selected mentor confirms in their own voice before the one tap
 * that is the verbal contract. Uses the WG roster (Marcus / Lyra / Goggs) so it
 * renders on-brand even before the backend mentor table is reseeded; the real
 * backend mentorId is merged in by slug when available (U2 handoff). U5 reskin.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

import { Button, Card, Header, MentorAvatar, Screen, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { PERSONALITIES, PersonalitySlug, personaBySlug } from '@/constants/Personalities';
import mentorService from '@/services/mentor.service';
import onboardingService from '@/services/onboarding.service';
import { goalsApiService } from '@/services/goals.service';
import { ROUTE_NAMES } from '@/constants/Routes';

export default function TodoPersonalityScreen() {
  const { space } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const { goalData } = useLocalSearchParams<{ goalData: string }>();

  const parsedGoal = useMemo(() => (goalData ? JSON.parse(goalData) : {}), [goalData]);

  // Default to the mentor the user matched with during onboarding; fall back to
  // Marcus (the prototype's pre-selected personality).
  const [selected, setSelected] = useState<PersonalitySlug>('marcus');
  // slug → backend mentor id (when the roster has been reseeded).
  const [mentorIds, setMentorIds] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    onboardingService.getMentor().then((saved) => {
      if (active && saved?.slug) setSelected(saved.slug);
    });
    mentorService
      .getMentorList()
      .then((mentors) => {
        if (!active) return;
        const map: Record<string, number> = {};
        for (const m of mentors) if (m.slug) map[m.slug] = m.id;
        setMentorIds(map);
      })
      .catch(() => {
        /* offline / not-yet-seeded — local roster still renders. */
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedPersona = personaBySlug(selected)!;

  const handleSign = async () => {
    setSaving(true);
    try {
      await goalsApiService.create({
        ...parsedGoal,
        mentorId: mentorIds[selected],
      });
      navigation.navigate(ROUTE_NAMES.TABS.self as any, {
        screen: ROUTE_NAMES.TABS.TODO_LIST_SCREEN,
      });
    } catch {
      Alert.alert('Could not save', 'Something went wrong saving your goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <Header eyebrow="3 / 3" title="Who's going to hold you to this?" />

      <View style={{ gap: space['4'] }}>
        {PERSONALITIES.map((p) => (
          <Card key={p.slug} selected={p.slug === selected} onPress={() => setSelected(p.slug)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space['4'] }}>
              <MentorAvatar mentor={p.slug} size={48} />
              <View style={{ flex: 1 }}>
                <Text variant="title">{p.name}</Text>
                <Text variant="muted">{p.role}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      <View style={{ marginTop: space['6'], gap: space['2'] }}>
        <Text variant="eyebrow">{`${selectedPersona.name} · will confirm`}</Text>
        <Text variant="display" style={{ fontSize: 20, lineHeight: 28 }}>
          {`“${selectedPersona.sampleLine}”`}
        </Text>
      </View>

      <View style={{ marginTop: space['8'], paddingBottom: space['4'], gap: space['1'] }}>
        <Button label="Sign me up" onPress={handleSign} loading={saving} disabled={saving} />
        <Text variant="muted" style={{ textAlign: 'center' }}>
          One tap = a verbal contract.
        </Text>
      </View>
    </Screen>
  );
}
