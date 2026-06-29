import React, { useRef, useState } from 'react';
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
import ExplanationSheet, { ExplanationSheetHandle } from '@/components/ExplanationSheet';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useTasks } from '@/hooks/useTasks';
import { useCompleteTask } from '@/hooks/useCompleteTask';
import { useExplainTask } from '@/hooks/useExplainTask';
import { ROUTE_NAMES } from '@/constants/Routes';
import { TaskItem } from '@/models';

// This goals tab is still a stub until real goal selection lands (U5). It has
// no concrete goal to scope tasks to yet, so we pass `null` — useTasks stays
// disabled and renders the empty state instead of hitting /tasks with a fake
// id (which made Postgres 500 on an invalid uuid).
const ACTIVE_GOAL_ID: string | null = null;

export default function TodoListScreen() {
  const { colors, space, radius } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const { tasks, loading, error, refetch, optimisticUpdateStatus } = useTasks(ACTIVE_GOAL_ID);

  const startNewGoal = () =>
    navigation.navigate(ROUTE_NAMES.TODO.self as any, {
      screen: ROUTE_NAMES.TODO.TODO_CREATE_SCREEN,
    });

  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
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
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: space['2'],
      paddingVertical: 2,
      borderRadius: radius.sm,
      marginTop: space['1'],
      marginBottom: space['3'],
    },
    actionRow: { flexDirection: 'row', gap: space['2'] },
    actionBtn: {
      flex: 1,
      paddingVertical: space['2'],
      borderRadius: radius.md,
      alignItems: 'center',
    },
    retryBtn: {
      marginTop: space['3'],
      paddingVertical: space['3'],
      paddingHorizontal: space['5'],
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
    },
  });

  const renderItem = ({ item }: { item: TaskItem }) => {
    const isPending = item.status === 'pending';
    const badgeColor =
      item.status === 'completed'
        ? colors.notificationSuccess
        : item.status === 'skipped'
        ? colors.notificationInfo
        : colors.canvas;

    return (
      <View style={s.card}>
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
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => openComplete(item)}
              accessibilityRole="button"
            >
              <Text variant="label" color="white">
                Done ✓
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.actionBtn,
                { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.border },
              ]}
              onPress={() => openExplain(item)}
              accessibilityRole="button"
            >
              <Text variant="label" color="textMuted">
                Skip
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <Screen padded={false} edges={['top']}>
      <Header
        title="goals"
        eyebrow="today's focus"
        style={{ paddingHorizontal: space['5'], marginBottom: space['3'] }}
      />

      <View style={{ paddingHorizontal: space['5'], marginBottom: space['4'] }}>
        <Button label="+ New goal" onPress={startNewGoal} />
      </View>

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
            nothing yet.
          </Text>
          <Text variant="muted" style={{ textAlign: 'center' }}>
            Your goals and their tasks will land here once you set one up with a mentor.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
        />
      )}

      <CompletionSheet
        ref={completionRef}
        taskTitle={activeTask?.title}
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
        submitting={explaining}
        mentorReaction={explanationReaction}
        safetyFlag={explanationSafety}
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
