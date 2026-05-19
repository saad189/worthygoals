import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import Background from '@/components/SubComponents/Background';
import Button from '@/components/SubComponents/Button';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useGoalProposal } from '@/hooks/useGoalProposal';
import { ROUTE_NAMES } from '@/constants/Routes';

function SkeletonLine({ width = '100%' }: { width?: string | number }) {
  return (
    <View style={[styles.skeletonLine, { width: width as any, opacity: 0.25 }]} />
  );
}

function FieldSkeleton({ label }: { label: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: colors.textWhite, opacity: 0.6 }]}>{label}</Text>
      <View style={[styles.skeletonBox, { backgroundColor: colors.surface }]}>
        <SkeletonLine />
        <SkeletonLine width="75%" />
      </View>
    </View>
  );
}

function EditableField({
  label,
  value,
  onChange,
  multiline = true,
  colors,
  radius,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  colors: any;
  radius: any;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: colors.textWhite, opacity: 0.6 }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        style={[
          styles.fieldInput,
          {
            color: colors.textWhite,
            backgroundColor: colors.surface,
            borderRadius: radius.sm ?? 8,
          },
        ]}
        placeholderTextColor={`${colors.textWhite}50`}
        placeholder={`Enter ${label.toLowerCase()}…`}
      />
    </View>
  );
}

export default function TodoProposeScreen() {
  const { colors, space, radius } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const { raw, skip } = useLocalSearchParams<{ raw: string; skip?: string }>();

  const { proposal, loading, error, propose } = useGoalProposal();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [costText, setCostText] = useState('');
  const [benefitText, setBenefitText] = useState('');
  const [failureText, setFailureText] = useState('');
  const [deadline, setDeadline] = useState('');

  const isSkip = skip === 'true';

  useEffect(() => {
    if (!isSkip && raw) {
      propose(raw);
    }
  }, []);

  useEffect(() => {
    if (proposal) {
      setTitle(proposal.title ?? '');
      setDescription(proposal.description ?? '');
      setCostText(proposal.costText ?? '');
      setBenefitText(proposal.benefitText ?? '');
      setFailureText(proposal.failureText ?? '');
      setDeadline(proposal.deadline ?? '');
    }
  }, [proposal]);

  const canProceed = title.trim().length >= 2;

  const handleNext = () => {
    navigation.navigate(ROUTE_NAMES.TODO.TODO_PERSONALITY_SCREEN, {
      goalData: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        costText: costText.trim() || undefined,
        benefitText: benefitText.trim() || undefined,
        failureText: failureText.trim() || undefined,
        deadline: deadline.trim() || undefined,
        category: proposal?.category,
        repeatRule: proposal?.repeatRule,
      }),
    } as any);
  };

  return (
    <Background style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={navigation.goBack} hitSlop={12}>
              <Text style={[styles.back, { color: colors.textWhite }]}>← Back</Text>
            </TouchableOpacity>
            <Text style={[styles.stepLabel, { color: colors.textWhite, opacity: 0.6 }]}>
              Step 2 of 3
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={[styles.body, { paddingHorizontal: space[5] ?? 20 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>
              {loading ? 'Building your goal…' : isSkip ? 'Fill in your goal' : 'Here\'s your proposal'}
            </Text>

            {!isSkip && error && (
              <Text style={[styles.errorBanner, { color: colors.dangerColor }]}>
                {error}
              </Text>
            )}

            {loading ? (
              <View style={{ gap: 16 }}>
                <FieldSkeleton label="Title" />
                <FieldSkeleton label="What will it cost you?" />
                <FieldSkeleton label="What do you gain?" />
                <FieldSkeleton label="What do you lose if you quit?" />
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                <EditableField label="Title *" value={title} onChange={setTitle} multiline={false} colors={colors} radius={radius} />
                <EditableField label="Description" value={description} onChange={setDescription} colors={colors} radius={radius} />
                <EditableField label="What will it cost you?" value={costText} onChange={setCostText} colors={colors} radius={radius} />
                <EditableField label="What do you gain?" value={benefitText} onChange={setBenefitText} colors={colors} radius={radius} />
                <EditableField label="What do you lose if you quit?" value={failureText} onChange={setFailureText} colors={colors} radius={radius} />
                <EditableField label="Deadline (YYYY-MM-DD)" value={deadline} onChange={setDeadline} multiline={false} colors={colors} radius={radius} />
              </View>
            )}

            <View style={styles.footerInScroll}>
              <Button
                mode="contained"
                disabled={loading || !canProceed}
                onPress={handleNext}
                style={styles.ctaButton}
              >
                Pick Your Mentor →
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  back: { fontSize: 16, fontWeight: '500' },
  stepLabel: { fontSize: 12, letterSpacing: 1 },
  body: { paddingTop: 16, paddingBottom: 40, gap: 4 },
  sectionTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  errorBanner: { fontSize: 13, marginBottom: 12 },
  fieldBlock: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
  fieldInput: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  skeletonBox: {
    padding: 14,
    borderRadius: 8,
    gap: 8,
    minHeight: 64,
    justifyContent: 'center',
  },
  skeletonLine: {
    height: 14,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  footerInScroll: {
    marginTop: 24,
    alignItems: 'center',
  },
  ctaButton: { width: '100%' },
});
