/**
 * Journey ③ · Your team — the 3-candidate personality match (Hi-Fi screen 03).
 * The forced-choice result recommends one personality; the other two are shown
 * "listening". The user picks one to start — the voice is heard before any
 * commitment. Resolves N-6 (onboarding choices now persist, §G/U4).
 *
 * Display copy/order comes from the local PERSONALITIES roster so this renders
 * correctly even if the backend mentor table hasn't been reseeded yet (U2
 * handoff); the real backend mentorId is merged in by slug when available.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Button, Card, Header, MentorAvatar, Screen, Text } from '@/components/ui';
import { ROUTE_NAMES } from '@/constants/Routes';
import {
  PERSONALITIES,
  PersonalitySlug,
  recommendPersonality,
} from '@/constants/Personalities';
import mentorService from '@/services/mentor.service';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function YourTeamScreen() {
  const { space } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const { hard, answered } = useLocalSearchParams<{ hard?: string; answered?: string }>();

  const recommended = useMemo(
    () => recommendPersonality(Number(hard ?? 0), Number(answered ?? 0)),
    [hard, answered],
  );

  const [selected, setSelected] = useState<PersonalitySlug>(recommended.slug);
  // slug → backend mentor id (when the roster has been reseeded).
  const [mentorIds, setMentorIds] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
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

  const onStart = () => {
    const persona = PERSONALITIES.find((p) => p.slug === selected)!;
    navigation.navigate(ROUTE_NAMES.JOURNEY.CONFIRM_SCREEN, {
      slug: persona.slug,
      name: persona.name,
      mentorId: mentorIds[persona.slug] != null ? String(mentorIds[persona.slug]) : '',
    } as never);
  };

  const selectedName = PERSONALITIES.find((p) => p.slug === selected)?.name ?? '';

  return (
    <Screen scroll>
      <Header eyebrow="BASED ON YOUR ANSWERS" title="Your team." />
      <Text variant="muted" style={{ marginBottom: space['6'] }}>
        Pick one to start. The other two are listening — they'll join when you're
        ready.
      </Text>

      <View style={{ gap: space['4'] }}>
        {PERSONALITIES.map((p) => {
          const isSelected = p.slug === selected;
          const isRecommended = p.slug === recommended.slug;
          return (
            <Card key={p.slug} selected={isSelected} onPress={() => setSelected(p.slug)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space['4'] }}>
                <MentorAvatar mentor={p.slug} size={48} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space['2'] }}>
                    <Text variant="title">{p.name}</Text>
                    {isRecommended ? (
                      <Text variant="eyebrow" color="primary">
                        · MATCH
                      </Text>
                    ) : null}
                  </View>
                  <Text variant="muted">{p.role}</Text>
                </View>
              </View>
              <Text variant="display" style={{ fontSize: 20, lineHeight: 26, marginTop: space['4'] }}>
                {`"${p.sampleLine}"`}
              </Text>
            </Card>
          );
        })}
      </View>

      <View style={{ marginTop: space['8'], paddingBottom: space['4'] }}>
        <Button label={`Start with ${selectedName}`} onPress={onStart} />
      </View>
    </Screen>
  );
}
