/**
 * Goal creation ③ · SIGN THE CONTRACT (Hi-Fi flow ② · screen 06, step 3/3).
 * "Who's going to hold you to this?" Picking a personality should feel like
 * signing — the selected mentor confirms in their own voice before the one tap
 * that is the verbal contract. Uses the WG roster (Marcus / Lyra / Goggs) so it
 * renders on-brand even before the backend mentor table is reseeded; the real
 * backend mentorId is merged in by slug when available (U2 handoff). U5 reskin.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { ApiCreateGoalPayload } from '@/types/api';

import { Button, Card, Header, MentorAvatar, Screen, StepDots, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { PERSONALITIES, PersonalitySlug, personaBySlug } from '@/constants/Personalities';
import { useMentors } from '@/hooks/useMentors';
import { useProfile } from '@/hooks/useProfile';
import { useCreateGoal } from '@/hooks/useCreateGoal';
import { ROUTE_NAMES } from '@/constants/Routes';

type GoalDraft = Omit<ApiCreateGoalPayload, 'mentorId'>;

const optStr = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

// The backend accepts these three (GoalCategory). Anything else — the AI
// draft can name categories the backend doesn't have (tracker D6) — is
// dropped so the server's default applies, rather than sent and 400'd.
const CATEGORIES: ReadonlyArray<GoalDraft['category']> = ['power', 'knowledge', 'spiritual'];
const optCategory = (v: unknown): GoalDraft['category'] =>
  CATEGORIES.find((c) => c === v);

/**
 * The draft the propose screen serialises into the route. Parsed field by
 * field: JSON.parse returns `any`, and spreading `any` into the payload erased
 * every constraint the generated type carries — the only write call site in
 * the app was untyped. Returns null when there is no usable title.
 */
function parseGoalDraft(raw?: string): GoalDraft | null {
  let v: unknown;
  try {
    v = raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const title = optStr(o.title)?.trim();
  if (!title) return null;
  return {
    title,
    description: optStr(o.description),
    costText: optStr(o.costText),
    benefitText: optStr(o.benefitText),
    failureText: optStr(o.failureText),
    deadline: optStr(o.deadline),
    category: optCategory(o.category),
    stakeAmount:
      typeof o.stakeAmount === 'number' && o.stakeAmount > 0 ? o.stakeAmount : undefined,
    repeatRule:
      o.repeatRule && typeof o.repeatRule === 'object' && !Array.isArray(o.repeatRule)
        ? (o.repeatRule as GoalDraft['repeatRule'])
        : undefined,
  };
}

export default function GoalPersonalityScreen() {
  const { space, colors } = useAppTheme();
  const { goalData, mentor } = useLocalSearchParams<{ goalData: string; mentor?: string }>();

  // A deep link can put anything in goalData (the scheme is public). JSON.parse
  // used to run unguarded inside render, so a malformed value threw into the
  // error boundary instead of just landing on an empty draft.
  const parsedGoal = useMemo(() => parseGoalDraft(goalData), [goalData]);

  // Pre-selection, in order: the mentor this goal was started from ("Set a goal
  // with X"), then the user's own mentor from the profile, then Marcus. The
  // onboarding value in local storage was used before, but it is empty after
  // a sign-in on a fresh install, so every user fell through to Marcus.
  const { mentorSlug: profileSlug } = useProfile();
  const [picked, setPicked] = useState<PersonalitySlug | null>(
    personaBySlug(mentor)?.slug ?? null,
  );
  const selected: PersonalitySlug = picked ?? profileSlug ?? 'marcus';
  const { createGoal, saving } = useCreateGoal();
  const { resolveMentorId } = useMentors();

  const selectedPersona = personaBySlug(selected)!;
  // The contract is confirmed in the chosen mentor's own colour (§F).
  const { accent } = useAppTheme(selected);

  // Sending mentorId: undefined is accepted by the DTO and then silently
  // resolves to Marcus in the weekly review — for the life of the goal. A goal
  // signed to the wrong mentor is worse than a goal not saved, so an
  // unresolved mentor stops the flow rather than guessing.
  // The button was disabled by the mutation's pending flag, which is still
  // false while resolveMentorId() fetches — a second tap there made a second
  // identical goal. A ref closes that window synchronously.
  const signing = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const handleSign = async () => {
    if (signing.current) return;
    signing.current = true;
    setSubmitting(true);
    try {
      await signGoal();
    } finally {
      signing.current = false;
      setSubmitting(false);
    }
  };

  const signGoal = async () => {
    if (!parsedGoal) {
      Alert.alert('Nothing to sign', 'This goal draft is missing its title. Go back and try again.');
      return;
    }
    const mentorId = await resolveMentorId(selected).catch(() => null);
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
        `/${ROUTE_NAMES.TABS.self}/${ROUTE_NAMES.TABS.GOAL_LIST_SCREEN}` as never,
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
          <Card key={p.slug} selected={p.slug === selected} onPress={() => setPicked(p.slug)}>
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
        <Button label="Sign me up" onPress={handleSign} loading={saving || submitting} disabled={saving || submitting} />
        <Text variant="muted" style={{ textAlign: 'center' }}>
          One tap = a verbal contract.
        </Text>
      </View>
    </Screen>
  );
}
