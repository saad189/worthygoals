import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

import { Button, Header, Screen, Text } from '@/components/ui';
import CompletionSheet, { CompletionSheetHandle } from '@/components/CompletionSheet';
import DidYouDoIt from '@/components/DidYouDoIt';
import ExplanationSheet, { ExplanationSheetHandle } from '@/components/ExplanationSheet';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useGoals } from '@/hooks/useGoals';
import { useMentors } from '@/hooks/useMentors';
import { useTasks } from '@/hooks/useTasks';
import { useCompleteTask } from '@/hooks/useCompleteTask';
import { useExplainTask } from '@/hooks/useExplainTask';
import { ROUTE_NAMES } from '@/constants/Routes';
import { ApiGoal, Mentor, TaskItem } from '@/models';

export default function TodoListScreen() {
  const { colors, space, radius } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const { goals, loading: goalsLoading, error: goalsError, refetch: refetchGoals } = useGoals();
  const { mentors } = useMentors();

  // Drill from the goals list into a single goal's task list. Tasks (and the
  // completion sheets) are scoped to whichever goal is selected — `useTasks`
  // stays disabled until one is.
  const [selectedGoal, setSelectedGoal] = useState<ApiGoal | null>(null);
  const { tasks, loading, error, refetch, optimisticUpdateStatus } = useTasks(
    selectedGoal?.id ?? null,
  );

  // On the WG roster `slug === personalityId`, so the goal's mentor slug is the
  // personality the completion sheets should react in. Falls back to null →
  // sheets default to Marcus.
  const personalityId = useMemo(() => {
    if (!selectedGoal?.mentorId) return null;
    return mentors.find((m: Mentor) => m.id === selectedGoal.mentorId)?.slug ?? null;
  }, [mentors, selectedGoal]);

  // Misses already recorded this week for the selected goal (Monday-start, the
  // weekly-review convention). From the 3rd miss on, the explanation sheet
  // escalates to the seriousness check whatever the reason — "3RD MISS THIS
  // WEEK" (screen 11).
  const missCountThisWeek = useMemo(() => {
    const weekStart = new Date();
    const day = weekStart.getDay(); // 0=Sun
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
    weekStart.setHours(0, 0, 0, 0);
    return tasks.filter(
      (t: TaskItem) => t.status === 'skipped' && new Date(t.updatedAt) >= weekStart,
    ).length;
  }, [tasks]);

  const startNewGoal = () =>
    navigation.navigate(ROUTE_NAMES.TODO.self as any, {
      screen: ROUTE_NAMES.TODO.TODO_CREATE_SCREEN,
    });

  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  // Screen 08 — the full-screen "Did you do it?" moment a pending task tap
  // opens before either sheet. Yes → CompletionSheet (09) · Not today →
  // ExplanationSheet (10).
  const [askTask, setAskTask] = useState<TaskItem | null>(null);
  const completionRef = useRef<CompletionSheetHandle>(null);
  const explanationRef = useRef<ExplanationSheetHandle>(null);

  const {
    complete,
    submitting: completing,
    mentorReaction: completionReaction,
    safetyFlag: completionSafety,
    clearReaction: clearCompletionReaction,
  } = useCompleteTask((taskId, hasReaction) => {
    optimisticUpdateStatus(taskId, 'completed');
    if (!hasReaction) {
      completionRef.current?.close();
      setActiveTask(null);
    }
    // If hasReaction: sheet stays open to show reaction; user taps Done to close
  });

  const {
    explain,
    submitting: explaining,
    mentorReaction: explanationReaction,
    safetyFlag: explanationSafety,
    clearReaction: clearExplanationReaction,
  } = useExplainTask((taskId, hasReaction) => {
    optimisticUpdateStatus(taskId, 'skipped');
    if (!hasReaction) {
      explanationRef.current?.close();
      setActiveTask(null);
    }
  });

  const openComplete = (task: TaskItem) => {
    setActiveTask(task);
    completionRef.current?.open();
  };

  const openExplain = (task: TaskItem) => {
    setActiveTask(task);
    explanationRef.current?.open();
  };

  // Let the full-screen modal finish fading before the bottom sheet animates
  // in, so the two transitions don't fight.
  const answerYes = (task: TaskItem) => {
    setAskTask(null);
    setTimeout(() => openComplete(task), 200);
  };

  const answerNotToday = (task: TaskItem) => {
    setAskTask(null);
    setTimeout(() => openExplain(task), 200);
  };

  const s = StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: space['6'],
    },
    list: { padding: space['4'] },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: space['4'],
      marginBottom: space['3'],
    },
    goalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['3'],
    },
    chevron: { marginLeft: 'auto' },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: space['2'],
      paddingVertical: 2,
      borderRadius: radius.sm,
      marginTop: space['1'],
      marginBottom: space['3'],
    },
    goalStatusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: space['2'],
      paddingVertical: 2,
      borderRadius: radius.sm,
      marginTop: space['2'],
      backgroundColor: colors.canvas,
    },
    retryBtn: {
      marginTop: space['3'],
      paddingVertical: space['3'],
      paddingHorizontal: space['5'],
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
    },
    backRow: {
      paddingHorizontal: space['5'],
      paddingTop: space['2'],
      paddingBottom: space['1'],
    },
  });

  // ── Goal card (list level) ──
  const renderGoal = ({ item }: { item: ApiGoal }) => (
    <TouchableOpacity
      style={[s.card, s.goalCard]}
      onPress={() => setSelectedGoal(item)}
      accessibilityRole="button"
      accessibilityLabel={`Open goal ${item.title}`}
    >
      <View style={{ flex: 1 }}>
        <Text variant="title">{item.title}</Text>
        {item.description ? (
          <Text variant="muted" numberOfLines={2} style={{ marginTop: space['1'] }}>
            {item.description}
          </Text>
        ) : null}
        <View style={s.goalStatusBadge}>
          <Text variant="eyebrow" color="textMuted">
            {item.status}
          </Text>
        </View>
      </View>
      <Text variant="title" color="textMuted" style={s.chevron}>
        ›
      </Text>
    </TouchableOpacity>
  );

  // ── Task card (drilled-in level) ──
  const renderTask = ({ item }: { item: TaskItem }) => {
    const isPending = item.status === 'pending';
    const badgeColor =
      item.status === 'completed'
        ? colors.notificationSuccess
        : item.status === 'skipped'
        ? colors.notificationInfo
        : colors.canvas;

    // A pending task opens the screen-08 "Did you do it?" moment — the binary
    // lives there, not on inline row buttons (flow ④ interception).
    return (
      <TouchableOpacity
        style={s.card}
        disabled={!isPending}
        onPress={() => setAskTask(item)}
        accessibilityRole="button"
        accessibilityLabel={isPending ? `Answer for ${item.title}` : item.title}
      >
        <Text variant="title">{item.title}</Text>
        {item.description ? (
          <Text variant="muted" style={{ marginTop: space['1'] }}>
            {item.description}
          </Text>
        ) : null}

        <View style={[s.statusBadge, { backgroundColor: badgeColor }]}>
          <Text variant="eyebrow" color="text">
            {item.status}
          </Text>
        </View>

        {isPending && (
          <Text variant="eyebrow" color="textMuted">
            tap to answer ›
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // ── Drilled-in view: one goal's tasks ──
  if (selectedGoal) {
    return (
      <Screen padded={false} edges={['top']}>
        <View style={s.backRow}>
          <TouchableOpacity
            onPress={() => setSelectedGoal(null)}
            accessibilityRole="button"
            accessibilityLabel="Back to goals"
          >
            <Text variant="label" color="textMuted">
              ‹ goals
            </Text>
          </TouchableOpacity>
        </View>
        <Header
          title={selectedGoal.title}
          eyebrow="your goal"
          style={{ paddingHorizontal: space['5'], marginBottom: space['3'] }}
        />

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="small" color={colors.text} />
          </View>
        ) : error ? (
          <View style={s.center}>
            <Text variant="body" style={{ textAlign: 'center' }}>
              {error}
            </Text>
            <TouchableOpacity style={s.retryBtn} onPress={refetch} accessibilityRole="button">
              <Text variant="label" color="white">
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        ) : tasks.length === 0 ? (
          <View style={s.center}>
            <Text variant="display" style={{ textAlign: 'center', marginBottom: space['2'] }}>
              no tasks yet.
            </Text>
            <Text variant="muted" style={{ textAlign: 'center' }}>
              This goal has no tasks to work on right now.
            </Text>
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(t) => t.id}
            renderItem={renderTask}
            contentContainerStyle={s.list}
          />
        )}

        <DidYouDoIt
          visible={!!askTask}
          taskTitle={askTask?.title}
          personalityId={personalityId}
          onYes={() => askTask && answerYes(askTask)}
          onNotToday={() => askTask && answerNotToday(askTask)}
          onDismiss={() => setAskTask(null)}
        />

        <CompletionSheet
          ref={completionRef}
          taskTitle={activeTask?.title}
          personalityId={personalityId}
          submitting={completing}
          mentorReaction={completionReaction}
          safetyFlag={completionSafety}
          onSubmit={(payload) => activeTask && complete(activeTask.id, payload)}
          onClose={() => {
            clearCompletionReaction();
            completionRef.current?.close();
            setActiveTask(null);
          }}
        />

        <ExplanationSheet
          ref={explanationRef}
          taskTitle={activeTask?.title}
          personalityId={personalityId}
          submitting={explaining}
          mentorReaction={explanationReaction}
          safetyFlag={explanationSafety}
          missCountThisWeek={missCountThisWeek}
          onSubmit={(payload) => activeTask && explain(activeTask.id, payload)}
          onClose={() => {
            clearExplanationReaction();
            explanationRef.current?.close();
            setActiveTask(null);
          }}
        />
      </Screen>
    );
  }

  // ── List view: the user's goals ──
  return (
    <Screen padded={false} edges={['top']}>
      <Header
        title="goals"
        eyebrow="what you're chasing"
        style={{ paddingHorizontal: space['5'], marginBottom: space['3'] }}
      />

      <View style={{ paddingHorizontal: space['5'], marginBottom: space['4'] }}>
        <Button label="+ New goal" onPress={startNewGoal} />
      </View>

      {goalsLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="small" color={colors.text} />
        </View>
      ) : goalsError ? (
        <View style={s.center}>
          <Text variant="body" style={{ textAlign: 'center' }}>
            {goalsError}
          </Text>
          <TouchableOpacity style={s.retryBtn} onPress={refetchGoals} accessibilityRole="button">
            <Text variant="label" color="white">
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : goals.length === 0 ? (
        <View style={s.center}>
          <Text variant="display" style={{ textAlign: 'center', marginBottom: space['2'] }}>
            nothing yet.
          </Text>
          <Text variant="muted" style={{ textAlign: 'center' }}>
            Set up your first goal with a mentor and it'll land here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={goals}
          keyExtractor={(g) => g.id}
          renderItem={renderGoal}
          contentContainerStyle={s.list}
        />
      )}
    </Screen>
  );
}
