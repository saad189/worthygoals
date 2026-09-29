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
import { router, useLocalSearchParams } from 'expo-router';

import { Button, Card, Header, MentorAvatar, Screen, StepDots, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { PERSONALITIES, PersonalitySlug, personaBySlug } from '@/constants/Personalities';
import mentorService from '@/services/mentor.service';
import onboardingService from '@/services/onboarding.service';
import { useCreateGoal } from '@/hooks/useCreateGoal';
import { ROUTE_NAMES } from '@/constants/Routes';

export default function TodoPersonalityScreen() {
  const { space, colors } = useAppTheme();
  const { goalData } = useLocalSearchParams<{ goalData: string }>();

  const parsedGoal = useMemo(() => (goalData ? JSON.parse(goalData) : {}), [goalData]);

  // Default to the mentor the user matched with during onboarding; fall back to
  // Marcus (the prototype's pre-selected personality).
  const [selected, setSelected] = useState<PersonalitySlug>('marcus');
  // slug → backend mentor id (when the roster has been reseeded).
  const [mentorIds, setMentorIds] = useState<Record<string, number>>({});
  const { createGoal, saving } = useCreateGoal();

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
  // The contract is confirmed in the chosen mentor's own colour (§F).
  const { accent } = useAppTheme(selected);

  /**
   * Resolve the chosen slug to a backend mentor id, retrying the roster fetch
   * once if the initial load failed.
   *
   * Sending mentorId: undefined is accepted by the DTO and then silently
   * resolves to Marcus in the weekly review — for the life of the goal. A goal
   * signed to the wrong mentor is worse than a goal not saved, so an
   * unresolved mentor stops the flow rather than guessing.
   */
  const resolveMentorId = async (): Promise<number | null> => {
    if (mentorIds[selected] != null) return mentorIds[selected];

    try {
      const mentors = await mentorService.getMentorList();
      const map: Record<string, number> = {};
      for (const m of mentors) if (m.slug) map[m.slug] = m.id;
      setMentorIds(map);
      return map[selected] ?? null;
    } catch {
      return null;
    }
  };

  const handleSign = async () => {
    const mentorId = await resolveMentorId();
    if (mentorId == null) {
      Alert.alert(
        'Could not reach your mentor',
        `We couldn't confirm ${selectedPersona.name} with the server, and we won't sign this goal to the wrong mentor. Check your connection and try again.`,
      );
      return;
    }

    try {
      await createGoal({
        ...parsedGoal,
        mentorId,
      });
      router.replace(
        `/${ROUTE_NAMES.TABS.self}/${ROUTE_NAMES.TABS.TODO_LIST_SCREEN}` as never,
      );
    } catch {
      Alert.alert('Could not save', 'Something went wrong saving your goal. Please try again.');
    }
  };

  return (
    <Screen scroll>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: space['5'],
        }}
      >
        <StepDots total={3} active={2} />
        <Text variant="mono">3 / 3</Text>
      </View>
      <Header title="Who's going to hold you to this?" />

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

      <Card style={{ marginTop: space['6'], backgroundColor: colors.canvas }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space['2'],
            marginBottom: space['3'],
          }}
        >
          <MentorAvatar mentor={selected} size={26} />
          <Text variant="eyebrow" style={{ color: accent }}>
            {selectedPersona.name}
          </Text>
          <Text variant="eyebrow" style={{ marginLeft: 'auto' }}>
            WILL CONFIRM
          </Text>
        </View>
        <Text variant="display" style={{ fontSize: 18, lineHeight: 24, color: accent }}>
          {`“${selectedPersona.sampleLine}”`}
        </Text>
      </Card>

      <View style={{ marginTop: space['8'], paddingBottom: space['4'], gap: space['1'] }}>
        <Button label="Sign me up" onPress={handleSign} loading={saving} disabled={saving} />
        <Text variant="muted" style={{ textAlign: 'center' }}>
          One tap = a verbal contract.
        </Text>
      </View>
    </Screen>
  );
}
