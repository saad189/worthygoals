/**
 * Goal creation ② · AI DRAFT (Hi-Fi flow ② · screen 05, step 2/3).
 * The LLM proposes the goal as cost / benefit / failure; the user edits, it
 * doesn't author. The FAILURE card uses the rust accent so the stake is
 * visible, and an optional stake toggle puts something concrete on the line.
 * Reskinned onto the warm-paper ui/ primitives (U5).
 */
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

import { Button, Header, Screen, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useGoalProposal } from '@/hooks/useGoalProposal';
import { ROUTE_NAMES } from '@/constants/Routes';
import Skeleton from '@/components/Common/Skeleton';

type FieldKey = 'title' | 'description' | 'costText' | 'benefitText' | 'failureText' | 'deadline';

function EditableField({
  label,
  value,
  onChange,
  placeholder,
  accent = false,
  multiline = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  accent?: boolean;
  multiline?: boolean;
}) {
  const { colors, space, radius, fonts, fontSizes } = useAppTheme();
  return (
    <View style={{ gap: space['2'] }}>
      <Text variant="eyebrow" color={accent ? 'primary' : 'textMuted'}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        style={{
          fontFamily: fonts.sans,
          fontSize: fontSizes.base,
          lineHeight: fontSizes.base * 1.45,
          color: colors.text,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: accent ? 1.5 : StyleSheet.hairlineWidth,
          borderColor: accent ? colors.primary : colors.border,
          paddingHorizontal: space['4'],
          paddingVertical: space['3'],
          minHeight: multiline ? 56 : 48,
          textAlignVertical: 'top',
        }}
      />
    </View>
  );
}

function FieldSkeleton() {
  const { space } = useAppTheme();
  return (
    <View style={{ gap: space['2'] }}>
      <Skeleton height={10} width="40%" radius={4} />
      <Skeleton height={52} width="100%" radius={10} />
    </View>
  );
}

export default function TodoProposeScreen() {
  const { colors, space, radius, fonts, fontSizes } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const { raw, skip } = useLocalSearchParams<{ raw: string; skip?: string }>();
  const { proposal, loading, error, propose } = useGoalProposal();

  const [fields, setFields] = useState<Record<FieldKey, string>>({
    title: '',
    description: '',
    costText: '',
    benefitText: '',
    failureText: '',
    deadline: '',
  });
  const [stakeOn, setStakeOn] = useState(false);
  const [stake, setStake] = useState('');

  const isSkip = skip === 'true';
  const set = (key: FieldKey) => (v: string) => setFields((f) => ({ ...f, [key]: v }));

  useEffect(() => {
    if (!isSkip && raw) propose(raw);
  }, []);

  useEffect(() => {
    if (proposal) {
      setFields({
        title: proposal.title ?? '',
        description: proposal.description ?? '',
        costText: proposal.costText ?? '',
        benefitText: proposal.benefitText ?? '',
        failureText: proposal.failureText ?? '',
        deadline: proposal.deadline ?? '',
      });
    }
  }, [proposal]);

  const canProceed = fields.title.trim().length >= 2;

  const handleNext = () => {
    const stakeAmount = stakeOn ? Number(stake) : undefined;
    navigation.navigate(ROUTE_NAMES.TODO.TODO_PERSONALITY_SCREEN, {
      goalData: JSON.stringify({
        title: fields.title.trim(),
        description: fields.description.trim() || undefined,
        costText: fields.costText.trim() || undefined,
        benefitText: fields.benefitText.trim() || undefined,
        failureText: fields.failureText.trim() || undefined,
        deadline: fields.deadline.trim() || undefined,
        stakeAmount: stakeAmount && stakeAmount > 0 ? stakeAmount : undefined,
        category: proposal?.category,
        repeatRule: proposal?.repeatRule,
      }),
    } as never);
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Header
          eyebrow={isSkip ? '2 / 3' : '2 / 3 · DRAFT'}
          title={loading ? 'Shaping it…' : isSkip ? 'Fill in your goal' : 'Here’s the shape of it.'}
        />

        {!isSkip && error ? (
          <Text variant="muted" color="primary" style={{ marginBottom: space['4'] }}>
            {error}
          </Text>
        ) : null}

        {loading ? (
          <View style={{ gap: space['5'] }}>
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </View>
        ) : (
          <View style={{ gap: space['5'] }}>
            <EditableField
              label="THE GOAL"
              value={fields.title}
              onChange={set('title')}
              placeholder="Run 5k 3×/week by June 14"
              multiline={false}
            />
            <EditableField
              label="DETAIL"
              value={fields.description}
              onChange={set('description')}
              placeholder="Anything that makes it concrete"
            />
            <EditableField
              label="COST · WHAT IT TAKES"
              value={fields.costText}
              onChange={set('costText')}
              placeholder="shoes · 90 min/wk · sore legs"
            />
            <EditableField
              label="BENEFIT · WHY IT MATTERS"
              value={fields.benefitText}
              onChange={set('benefitText')}
              placeholder="energy back · wedding photos"
            />
            <EditableField
              label="FAILURE · WHAT'S LOST"
              value={fields.failureText}
              onChange={set('failureText')}
              placeholder="another summer of the same loop"
              accent
            />
            <EditableField
              label="DEADLINE · YYYY-MM-DD"
              value={fields.deadline}
              onChange={set('deadline')}
              placeholder="2026-06-14"
              multiline={false}
            />

            <Pressable
              onPress={() => setStakeOn((s) => !s)}
              accessibilityRole="switch"
              accessibilityState={{ checked: stakeOn }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space['3'] }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: radius.sm,
                  borderWidth: 1.5,
                  borderColor: stakeOn ? colors.primary : colors.border,
                  backgroundColor: stakeOn ? colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {stakeOn ? (
                  <Text variant="label" color="white" style={{ fontSize: 13, lineHeight: 16 }}>
                    ✓
                  </Text>
                ) : null}
              </View>
              <Text variant="label">Put something on the line</Text>
            </Pressable>

            {stakeOn ? (
              <TextInput
                value={stake}
                onChangeText={setStake}
                keyboardType="number-pad"
                placeholder="Amount you forfeit if you quit (e.g. 50)"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Stake amount"
                style={{
                  fontFamily: fonts.mono,
                  fontSize: fontSizes.base,
                  color: colors.text,
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                  paddingHorizontal: space['4'],
                  paddingVertical: space['3'],
                }}
              />
            ) : null}
          </View>
        )}

        <View style={{ marginTop: space['8'], paddingBottom: space['4'] }}>
          <Button label="Looks right →" onPress={handleNext} disabled={loading || !canProceed} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
