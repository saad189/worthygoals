import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Background from '@/components/SubComponents/Background';
import CompletionSheet, { CompletionSheetHandle } from '@/components/CompletionSheet';
import ExplanationSheet, { ExplanationSheetHandle } from '@/components/ExplanationSheet';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useTasks } from '@/hooks/useTasks';
import { useCompleteTask } from '@/hooks/useCompleteTask';
import { useExplainTask } from '@/hooks/useExplainTask';
import { TaskItem } from '@/models';

// This goals tab is still a stub until real goal selection lands (U5). It has
// no concrete goal to scope tasks to yet, so we pass `null` — useTasks stays
// disabled and renders the empty state instead of hitting /tasks with a fake
// id (which made Postgres 500 on an invalid uuid).
const ACTIVE_GOAL_ID: string | null = null;

export default function TodoListWithBackground() {
  return (
    <Background style={{ flex: 1 }}>
      <TodoListScreen />
    </Background>
  );
}

function TodoListScreen() {
  const { colors, space, radius } = useAppTheme();
  const { tasks, loading, error, refetch, optimisticUpdateStatus } = useTasks(ACTIVE_GOAL_ID);

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
    container: { flex: 1 },
    header: {
      padding: space['4'],
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.textWhite,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: space['6'],
    },
    centerText: { color: colors.textWhite, fontSize: 14 },
    list: { padding: space['4'] },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: space['4'],
      marginBottom: space['3'],
    },
    taskTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: space['1'],
    },
    taskDesc: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: space['3'],
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: space['2'],
      paddingVertical: 2,
      borderRadius: radius.sm,
      marginBottom: space['3'],
    },
    statusText: { fontSize: 11, fontWeight: '600' },
    actionRow: { flexDirection: 'row', gap: space['2'] },
    actionBtn: {
      flex: 1,
      paddingVertical: space['2'],
      borderRadius: radius.md,
      alignItems: 'center',
    },
    actionText: { fontSize: 13, fontWeight: '600' },
    retryBtn: {
      marginTop: space['3'],
      paddingVertical: space['3'],
      paddingHorizontal: space['5'],
      borderRadius: radius.md,
      backgroundColor: colors.primary,
    },
    retryText: { color: colors.textWhite, fontSize: 14, fontWeight: '600' },
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
        <Text style={s.taskTitle}>{item.title}</Text>
        {item.description ? <Text style={s.taskDesc}>{item.description}</Text> : null}

        <View style={[s.statusBadge, { backgroundColor: badgeColor }]}>
          <Text style={[s.statusText, { color: colors.text }]}>{item.status}</Text>
        </View>

        {isPending && (
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() => openComplete(item)}
            >
              <Text style={[s.actionText, { color: colors.textWhite }]}>Done ✓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                s.actionBtn,
                { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.border },
              ]}
              onPress={() => openExplain(item)}
            >
              <Text style={[s.actionText, { color: colors.textMuted }]}>Skip</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>To-do</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="small" color={colors.textWhite} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={s.centerText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={refetch}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : tasks.length === 0 ? (
        <View style={s.center}>
          <Text style={s.centerText}>No tasks yet.</Text>
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
    </SafeAreaView>
  );
}
