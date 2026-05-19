import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import Background from '@/components/SubComponents/Background';
import Button from '@/components/SubComponents/Button';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Mentor } from '@/models';
import mentorService from '@/services/mentor.service';
import { goalsApiService } from '@/services/goals.service';
import { ROUTE_NAMES } from '@/constants/Routes';

export default function TodoPersonalityScreen() {
  const { colors, space, radius } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const { goalData } = useLocalSearchParams<{ goalData: string }>();

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const parsedGoal = goalData ? JSON.parse(goalData) : {};

  const fetchMentors = useCallback(async () => {
    try {
      const list = await mentorService.getMentorList();
      setMentors(list);
    } catch {
      setMentors([]);
    } finally {
      setLoadingMentors(false);
    }
  }, []);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const handleSave = async (mentorId?: number) => {
    setSaving(true);
    try {
      await goalsApiService.create({
        ...parsedGoal,
        mentorId: mentorId ?? selectedMentorId ?? undefined,
      });
      navigation.navigate(ROUTE_NAMES.TABS.self as any, {
        screen: ROUTE_NAMES.TABS.TODO_LIST_SCREEN,
      });
    } catch {
      Alert.alert('Error', 'Could not save your goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkipMentor = () => handleSave(undefined);

  return (
    <Background style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={navigation.goBack} hitSlop={12}>
            <Text style={[styles.back, { color: colors.textWhite }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.stepLabel, { color: colors.textWhite, opacity: 0.6 }]}>
            Step 3 of 3
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.body, { paddingHorizontal: space[5] ?? 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>
            Who will hold you accountable?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textWhite, opacity: 0.7 }]}>
            Pick a mentor personality — or save without one.
          </Text>

          {loadingMentors ? (
            <ActivityIndicator color={colors.textWhite} style={{ marginTop: 32 }} />
          ) : mentors.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textWhite, opacity: 0.5 }]}>
              No mentors available. You can still save the goal.
            </Text>
          ) : (
            <View style={styles.mentorList}>
              {mentors.map((mentor) => {
                const selected = selectedMentorId === mentor.id;
                return (
                  <TouchableOpacity
                    key={mentor.id}
                    onPress={() => setSelectedMentorId(selected ? null : mentor.id)}
                    style={[
                      styles.mentorCard,
                      {
                        backgroundColor: selected ? colors.primary : colors.surface,
                        borderRadius: radius.md ?? 12,
                        borderWidth: selected ? 0 : 1,
                        borderColor: `${colors.textWhite}20`,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.mentorName, { color: colors.textWhite }]}>
                      {mentor.name}
                    </Text>
                    {!!mentor.shortDescription && (
                      <Text style={[styles.mentorDesc, { color: colors.textWhite, opacity: 0.7 }]}>
                        {mentor.shortDescription}
                      </Text>
                    )}
                    {selected && (
                      <Text style={[styles.selectedBadge, { color: colors.textWhite }]}>✓ Selected</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.footerInScroll}>
            <TouchableOpacity onPress={handleSkipMentor} disabled={saving}>
              <Text style={[styles.skipLink, { color: colors.textWhite, opacity: saving ? 0.3 : 0.6 }]}>
                Save without a mentor
              </Text>
            </TouchableOpacity>
            <Button
              mode="contained"
              disabled={saving || selectedMentorId === null}
              onPress={() => handleSave(selectedMentorId!)}
              style={styles.ctaButton}
              loading={saving}
            >
              Save Goal
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
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
  body: { paddingTop: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  emptyText: { fontSize: 14, marginTop: 16 },
  mentorList: { gap: 12 },
  mentorCard: {
    padding: 16,
    gap: 4,
  },
  mentorName: { fontSize: 17, fontWeight: '700' },
  mentorDesc: { fontSize: 13, lineHeight: 20 },
  selectedBadge: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  footerInScroll: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  skipLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  ctaButton: { width: '100%' },
});
