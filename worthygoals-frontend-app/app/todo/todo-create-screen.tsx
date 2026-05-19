import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import Background from '@/components/SubComponents/Background';
import Button from '@/components/SubComponents/Button';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ROUTE_NAMES } from '@/constants/Routes';

export default function TodoCreateScreen() {
  const { colors, space, radius } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const [raw, setRaw] = useState('');

  const canProceed = raw.trim().length >= 5;

  const handleGetAiProposal = () => {
    navigation.navigate(ROUTE_NAMES.TODO.TODO_PROPOSE_SCREEN, { raw: raw.trim() } as any);
  };

  const handleSkipAi = () => {
    navigation.navigate(ROUTE_NAMES.TODO.TODO_PROPOSE_SCREEN, { raw: raw.trim(), skip: 'true' } as any);
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
              Step 1 of 3
            </Text>
          </View>

          <View style={styles.body}>
            <Text style={[styles.title, { color: colors.textWhite }]}>
              What do you want to achieve?
            </Text>
            <Text style={[styles.subtitle, { color: colors.textWhite, opacity: 0.7 }]}>
              Describe your ambition in your own words. The AI will structure it into a goal — or skip and fill it in manually.
            </Text>

            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
              <TextInput
                value={raw}
                onChangeText={setRaw}
                multiline
                numberOfLines={5}
                placeholder="e.g. I want to run a half-marathon by October"
                placeholderTextColor={`${colors.textWhite}60`}
                style={[styles.input, { color: colors.textWhite }]}
              />
            </View>
          </View>

          <View style={[styles.footer, { paddingHorizontal: space[5] ?? 20 }]}>
            <TouchableOpacity onPress={handleSkipAi} disabled={!canProceed}>
              <Text style={[styles.skipLink, { color: colors.textWhite, opacity: canProceed ? 0.7 : 0.3 }]}>
                Skip AI — fill in manually
              </Text>
            </TouchableOpacity>
            <Button
              mode="contained"
              disabled={!canProceed}
              onPress={handleGetAiProposal}
              style={styles.ctaButton}
            >
              Get AI Proposal
            </Button>
          </View>
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
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  inputWrapper: {
    padding: 16,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  footer: {
    paddingBottom: 32,
    gap: 12,
    alignItems: 'center',
  },
  skipLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
    marginBottom: 4,
  },
  ctaButton: {
    width: '100%',
  },
});
