import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { MotiView } from 'moti';
import { Button, MentorAvatar, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ExplainTaskPayload, ExplanationReason } from '@/models';
import { personaBySlug, PersonalitySlug } from '@/constants/Personalities';
import { triggerPersonalityHaptic, triggerSelectionHaptic } from '@/helpers/haptics';
import { ordinal } from '@/helpers/Ordinal';

// Hi-Fi flow ④ · screen 10 (FAILURE → WHICH ONE?). Three verbs, three downstream
// behaviours; "chose not to" is the honest one — it's accent-only (the same rust
// as the stake in goal creation) and it triggers the seriousness check (screen 11).
const REASONS: {
  value: ExplanationReason;
  label: string;
  note: string;
  accent?: boolean;
}[] = [
  { value: 'couldnt', label: "Couldn't", note: 'Body said no. A smaller version shows up next.' },
  { value: 'forgot', label: 'Forgot', note: 'We move the reminder. Light ribbing.' },
  { value: 'chose_not_to', label: 'Chose not to', note: 'The honest one.', accent: true },
];

// In-voice line for the seriousness check, scaled to the matched mentor.
const SERIOUSNESS_LINE: Record<PersonalitySlug, string> = {
  lyra: "No judgment. But I won't keep nudging you toward something you've stopped wanting.",
  marcus:
    "No judgment. But I'm not going to keep buzzing your phone for something you don't want.",
  goggs: "I'M NOT WASTING MY BREATH ON A GOAL YOU DON'T WANT. SO — DO YOU?",
};

interface Props {
  taskTitle?: string;
  personalityId?: string | null;
  submitting: boolean;
  mentorReaction?: string | null;
  safetyFlag?: boolean;
  /** Misses already recorded this week for this goal (excluding this one).
   *  At 2+ prior misses this one is the 3rd — the seriousness check fires
   *  regardless of which reason was picked (design: "3RD MISS THIS WEEK"). */
  missCountThisWeek?: number;
  onSubmit: (payload: ExplainTaskPayload) => void;
  onClose: () => void;
}

export interface ExplanationSheetHandle {
  open: () => void;
  close: () => void;
}

type Phase = 'pick' | 'serious';

const ExplanationSheet = forwardRef<ExplanationSheetHandle, Props>(
  (
    {
      taskTitle,
      personalityId,
      submitting,
      mentorReaction,
      safetyFlag,
      missCountThisWeek = 0,
      onSubmit,
      onClose,
    },
    ref,
  ) => {
    const { colors, space, radius } = useAppTheme();
    const sheetRef = useRef<BottomSheet>(null);
    const [reason, setReason] = useState<ExplanationReason | null>(null);
    const [phase, setPhase] = useState<Phase>('pick');

    const snapPoints = useMemo(() => ['68%'], []);

    const persona = personaBySlug(personalityId ?? undefined);
    const mentorName = persona?.name ?? 'Your mentor';
    const seriousLine = SERIOUSNESS_LINE[(persona?.slug ?? 'marcus') as PersonalitySlug];

    const showingCrisis = !!safetyFlag;
    const showingReaction = !submitting && !!mentorReaction && !showingCrisis;
    const showingSerious = phase === 'serious' && !showingReaction && !showingCrisis;

    React.useImperativeHandle(ref, () => ({
      open: () => {
        setReason(null);
        setPhase('pick');
        sheetRef.current?.expand();
      },
      close: () => sheetRef.current?.close(),
    }));

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      [],
    );

    const handleReasonSelect = (value: ExplanationReason) => {
      triggerSelectionHaptic();
      setReason(value);
    };

    // This miss's number within the week (prior recorded misses + this one).
    // From the 3rd on, every miss earns the check regardless of the reason —
    // the design's "3RD MISS THIS WEEK" trigger (screen 11).
    const missNumber = missCountThisWeek + 1;
    const missTriggered = missNumber >= 3;

    const handleSubmit = () => {
      if (!reason) return;
      // The deliberate skip — or the 3rd miss this week, whatever the reason —
      // earns a seriousness check before it's recorded.
      if (reason === 'chose_not_to' || missTriggered) {
        triggerSelectionHaptic();
        setPhase('serious');
        return;
      }
      triggerPersonalityHaptic(personalityId);
      onSubmit({ reason, personalityId: personalityId ?? undefined });
    };

    // The three real outs on the seriousness check. All record the reason the
    // user actually picked; "push harder" keeps the sheet for the mentor's
    // reaction, the other two close out. (Pausing / archiving the goal itself
    // is a backend lifecycle step that doesn't exist yet — see handoff.)
    const handleSeriousCommit = (action: 'push' | 'pause' | 'let_go') => {
      triggerPersonalityHaptic(personalityId);
      onSubmit({ reason: reason ?? 'chose_not_to', personalityId: personalityId ?? undefined });
      if (action !== 'push') onClose();
    };

    const s = StyleSheet.create({
      content: { flex: 1, backgroundColor: colors.surface },
      scroll: { padding: space['5'], paddingBottom: space['6'] },
      taskEyebrow: { marginTop: space['1'], marginBottom: space['5'] },
      option: {
        padding: space['4'],
        borderRadius: radius.md,
        borderWidth: 1.5,
        marginBottom: space['3'],
      },
      hint: { textAlign: 'center', marginTop: space['1'] },
      // ── In-voice mentor card (reaction · crisis · seriousness) ──
      card: {
        margin: space['5'],
        padding: space['4'],
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.canvas,
      },
      mentorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: space['3'] },
      reactionText: { fontStyle: 'italic', lineHeight: 24, marginBottom: space['4'] },
      crisisText: { lineHeight: 22, marginBottom: space['4'] },
      seriousQ: { marginBottom: space['3'] },
      outStack: { gap: space['2'], marginTop: space['1'] },
    });

    const renderReactionView = () => (
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350 }}
        style={s.card}
      >
        <View style={s.mentorRow}>
          <MentorAvatar mentor={personalityId ?? 'marcus'} size={32} />
          <Text variant="eyebrow">{showingCrisis ? 'Resources' : mentorName}</Text>
        </View>
        <Text variant={showingCrisis ? 'body' : 'display'} style={showingCrisis ? s.crisisText : s.reactionText}>
          {showingCrisis
            ? "Your wellbeing matters far more than any goal.\n\nIf you're in crisis:\n• Call or text 988\n• Text HOME to 741741\n• findahelpline.com"
            : mentorReaction}
        </Text>
        <Button label="Close" onPress={onClose} />
      </MotiView>
    );

    // Screen 11 — the seriousness check. Quiet, charged, three real outs.
    const renderSeriousView = () => (
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350 }}
        style={s.card}
      >
        <Text
          variant="eyebrow"
          color={missTriggered ? 'primary' : undefined}
          style={{ marginBottom: space['2'] }}
        >
          {missTriggered ? `${ordinal(missNumber)} MISS THIS WEEK` : 'A deliberate skip'}
        </Text>
        <Text variant="display" style={s.seriousQ}>
          Do you actually want this?
        </Text>
        <View style={s.mentorRow}>
          <MentorAvatar mentor={personalityId ?? 'marcus'} size={32} />
          <Text variant="eyebrow">{mentorName}</Text>
        </View>
        <Text variant="body" style={s.reactionText}>
          {seriousLine}
        </Text>
        <View style={s.outStack}>
          <Button
            label="I want it. Push harder."
            onPress={() => handleSeriousCommit('push')}
            loading={submitting}
            disabled={submitting}
          />
          <Button
            label="Let it go"
            variant="accent"
            onPress={() => handleSeriousCommit('let_go')}
            disabled={submitting}
          />
          <Button
            label="Pause this goal"
            variant="link"
            onPress={() => handleSeriousCommit('pause')}
            disabled={submitting}
          />
        </View>
      </MotiView>
    );

    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onClose={onClose}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
        backgroundStyle={{ backgroundColor: colors.surface }}
      >
        <BottomSheetView style={s.content}>
          {showingReaction || showingCrisis ? (
            renderReactionView()
          ) : showingSerious ? (
            renderSeriousView()
          ) : (
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
              <Text variant="display">Which one is it?</Text>
              <Text variant="eyebrow" style={s.taskEyebrow} numberOfLines={1}>
                {(taskTitle ?? 'Task').toUpperCase()} · NOT TODAY
              </Text>

              {REASONS.map(({ value, label, note, accent }) => {
                const selected = reason === value;
                const ring = accent ? colors.primary : colors.text;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      s.option,
                      {
                        borderColor: selected ? ring : colors.border,
                        backgroundColor: selected ? colors.canvas : colors.surface,
                      },
                    ]}
                    onPress={() => handleReasonSelect(value)}
                    accessibilityLabel={label}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text variant="title" color={accent ? 'primary' : 'text'}>
                      {label}
                    </Text>
                    <Text variant="muted" style={{ marginTop: 2 }}>
                      {note}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <Button
                label="That's the truth"
                onPress={handleSubmit}
                loading={submitting}
                disabled={!reason || submitting}
                style={{ marginTop: space['2'] }}
              />
              <Text variant="muted" style={s.hint}>
                no shortcuts here · pick one
              </Text>
            </ScrollView>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

ExplanationSheet.displayName = 'ExplanationSheet';
export default ExplanationSheet;
