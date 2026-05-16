import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAppTheme } from '@/hooks/useAppTheme';
import { ExplainTaskPayload, ExplanationReason } from '@/models';

const REASONS: { value: ExplanationReason; label: string; description: string }[] = [
  { value: 'couldnt', label: "Couldn't do it", description: 'Something blocked me' },
  { value: 'forgot', label: 'Forgot', description: "It slipped my mind" },
  { value: 'chose_not_to', label: 'Chose not to', description: 'I decided to skip it' },
];

interface Props {
  taskTitle?: string;
  submitting: boolean;
  onSubmit: (payload: ExplainTaskPayload) => void;
  onClose: () => void;
}

export interface ExplanationSheetHandle {
  open: () => void;
  close: () => void;
}

const ExplanationSheet = forwardRef<ExplanationSheetHandle, Props>(
  ({ taskTitle, submitting, onSubmit, onClose }, ref) => {
    const { colors, space, radius } = useAppTheme();
    const sheetRef = useRef<BottomSheet>(null);
    const [reason, setReason] = useState<ExplanationReason | null>(null);

    const snapPoints = useMemo(() => ['45%'], []);

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

    const handleSubmit = () => {
      if (!reason) return;
      onSubmit({ reason });
    };

    const s = StyleSheet.create({
      content: {
        flex: 1,
        padding: space['5'],
        backgroundColor: colors.surface,
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
    });

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
                onPress={() => setReason(value)}
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
          >
            {submitting ? (
              <ActivityIndicator color={colors.textWhite} />
            ) : (
              <Text style={[s.submitText, { color: colors.textWhite }]}>Submit</Text>
            )}
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

ExplanationSheet.displayName = 'ExplanationSheet';
export default ExplanationSheet;
