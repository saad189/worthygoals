import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { MotiView } from 'moti';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ExplainTaskPayload, ExplanationReason } from '@/models';
import { triggerPersonalityHaptic, triggerSelectionHaptic } from '@/helpers/haptics';

const REASONS: { value: ExplanationReason; label: string; description: string }[] = [
  { value: 'couldnt', label: "Couldn't do it", description: 'Something blocked me' },
  { value: 'forgot', label: 'Forgot', description: "It slipped my mind" },
  { value: 'chose_not_to', label: 'Chose not to', description: 'I decided to skip it' },
];

interface Props {
  taskTitle?: string;
  personalityId?: string | null;
  submitting: boolean;
  mentorReaction?: string | null;
  safetyFlag?: boolean;
  onSubmit: (payload: ExplainTaskPayload) => void;
  onClose: () => void;
}

export interface ExplanationSheetHandle {
  open: () => void;
  close: () => void;
}

const ExplanationSheet = forwardRef<ExplanationSheetHandle, Props>(
  ({ taskTitle, personalityId, submitting, mentorReaction, safetyFlag, onSubmit, onClose }, ref) => {
    const { colors, space, radius } = useAppTheme();
    const sheetRef = useRef<BottomSheet>(null);
    const [reason, setReason] = useState<ExplanationReason | null>(null);

    const snapPoints = useMemo(() => ['65%'], []);

    const showingReaction = !submitting && !!mentorReaction && !safetyFlag;
    const showingCrisis = !!safetyFlag;

    React.useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.expand(),
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

    const handleSubmit = () => {
      if (!reason) return;
      triggerPersonalityHaptic(personalityId);
      onSubmit({ reason, personalityId: personalityId ?? undefined });
    };

    const s = StyleSheet.create({
      content: {
        flex: 1,
        backgroundColor: colors.surface,
      },
      scroll: {
        padding: space['5'],
      },
      title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: space['1'],
      },
      subtitle: {
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: space['5'],
      },
      option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: space['4'],
        borderRadius: radius.md,
        borderWidth: 2,
        marginBottom: space['3'],
      },
      optionLabel: {
        fontSize: 15,
        fontWeight: '600',
      },
      optionDesc: {
        fontSize: 12,
        marginTop: 2,
      },
      submitBtn: {
        marginTop: space['2'],
        paddingVertical: space['4'],
        borderRadius: radius.md,
        alignItems: 'center',
      },
      submitText: {
        fontSize: 15,
        fontWeight: '700',
      },
      reactionCard: {
        margin: space['5'],
        padding: space['4'],
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.canvas,
      },
      reactionLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: colors.textMuted,
        marginBottom: space['2'],
      },
      reactionText: {
        fontSize: 15,
        color: colors.text,
        lineHeight: 22,
        fontStyle: 'italic',
        marginBottom: space['4'],
      },
      crisisText: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 22,
        marginBottom: space['4'],
      },
      doneBtn: {
        paddingVertical: space['3'],
        borderRadius: radius.md,
        alignItems: 'center',
        backgroundColor: colors.primary,
      },
      doneBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textWhite,
      },
    });

    const renderReactionView = () => (
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350 }}
        style={s.reactionCard}
      >
        <Text style={s.reactionLabel}>
          {showingCrisis ? 'Resources' : 'Your mentor says'}
        </Text>
        <Text style={showingCrisis ? s.crisisText : s.reactionText}>
          {showingCrisis
            ? "Your wellbeing matters far more than any goal.\n\nIf you're in crisis:\n• Call or text 988\n• Text HOME to 741741\n• findahelpline.com"
            : mentorReaction}
        </Text>
        <TouchableOpacity
          style={s.doneBtn}
          onPress={onClose}
          accessibilityLabel="Done"
          accessibilityRole="button"
        >
          <Text style={s.doneBtnText}>Done</Text>
        </TouchableOpacity>
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
          ) : (
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
              <Text style={s.title}>Why skipping?</Text>
              <Text style={s.subtitle} numberOfLines={1}>
                {taskTitle ?? 'Task'}
              </Text>

              {REASONS.map(({ value, label, description }) => {
                const selected = reason === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[
                      s.option,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.primarySubtle : colors.canvas,
                      },
                    ]}
                    onPress={() => handleReasonSelect(value)}
                    accessibilityLabel={label}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <View>
                      <Text style={[s.optionLabel, { color: selected ? colors.primary : colors.text }]}>
                        {label}
                      </Text>
                      <Text style={[s.optionDesc, { color: colors.textMuted }]}>{description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[s.submitBtn, { backgroundColor: reason ? colors.primary : colors.border }]}
                onPress={handleSubmit}
                disabled={!reason || submitting}
                accessibilityLabel="Submit explanation"
                accessibilityRole="button"
                accessibilityState={{ disabled: !reason || submitting }}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.textWhite} />
                ) : (
                  <Text style={[s.submitText, { color: colors.textWhite }]}>Submit</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

ExplanationSheet.displayName = 'ExplanationSheet';
export default ExplanationSheet;
