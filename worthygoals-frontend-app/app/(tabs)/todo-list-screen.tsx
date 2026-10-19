import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

import { Button, Header, Screen, Text } from '@/components/ui';
import CompletionSheet, { CompletionSheetHandle } from '@/components/CompletionSheet';
import DidYouDoIt from '@/components/DidYouDoIt';
import ExplanationSheet, { ExplanationSheetHandle } from '@/components/ExplanationSheet';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useGoals, useSetGoalStatus } from '@/hooks/useGoals';
import { useMentors } from '@/hooks/useMentors';
import { useTasks } from '@/hooks/useTasks';
import { useCompleteTask } from '@/hooks/useCompleteTask';
import { useExplainTask } from '@/hooks/useExplainTask';
import { ROUTE_NAMES } from '@/constants/Routes';
import { ApiGoal, GoalStatus, Mentor, TaskItem } from '@/models';

const STATUS_ORDER: Record<GoalStatus, number> = {
  active: 0,
  paused: 1,
  completed: 2,
  archived: 3,
};

/** The words the user picked, not the stored enum ("archived" is Let it go). */
const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  active: 'active',
  paused: 'paused',
  completed: 'done',
  archived: 'let go',
};

/** The banner a goal that's not in play shows above its tasks. */
const AWAY_COPY: Partial<Record<GoalStatus, { title: string; body: string; cta: string }>> = {
  paused: {
    title: 'Paused',
    body: 'Off your today screen, and your mentor stays quiet about it. Nothing is lost.',
    cta: 'Resume this goal',
  },
  archived: {
    title: 'You let this one go',
    body: 'No tasks, no nudges. Its history stays here if you want it back.',
    cta: 'Bring it back',
  },
};

export default function TodoListScreen() {
  const { colors, space, radius } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const { goals: allGoals, loading: goalsLoading, error: goalsError, refetch: refetchGoals } = useGoals();
  const { mentors } = useMentors();
  const { setStatus, updating: updatingStatus } = useSetGoalStatus();
  // What you're working on first; paused, then let-go goals below it.
  const goals = useMemo(
    () =>
      [...allGoals].sort(
        (a: ApiGoal, b: ApiGoal) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
      ),
    [allGoals],
  );

  // Drill from the goals list into a single goal's task list. Tasks (and the
  // completion sheets) are scoped to whichever goal is selected — `useTasks`
  // stays disabled until one is.
  // Held by id and read from the goals list, so an edit shows up here at once
  // and a deleted goal drops back to the list instead of a stale copy.
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const selectedGoal = useMemo(
    () => goals.find((g: ApiGoal) => g.id === selectedGoalId) ?? null,
    [goals, selectedGoalId],
  );
  const { tasks, loading, error, refetch } = useTasks(
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

  const openEdit = (kind: 'goal' | 'task', id: string, goalId?: string) =>
    navigation.navigate(ROUTE_NAMES.TODO.self as any, {
      screen: ROUTE_NAMES.TODO.TODO_EDIT_SCREEN,
      params: { kind, id, goalId },
    });

  const startNewGoal = () =>
    navigation.navigate(ROUTE_NAMES.TODO.self as any, {
      screen: ROUTE_NAMES.TODO.TODO_CREATE_SCREEN,
    });

  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  // The task a sheet is acting on, held in a ref so the submit handler can't be
  // defeated by `activeTask` state being cleared out from under the open sheet.
  const actingTaskRef = useRef<TaskItem | null>(null);
  // Screen 08 — the full-screen "Did you do it?" moment a pending task tap
  // opens before either sheet. Yes → CompletionSheet (09) · Not today →
  // ExplanationSheet (10).
  const [askTask, setAskTask] = useState<TaskItem | null>(null);
  const completionRef = useRef<CompletionSheetHandle>(null);
  const explanationRef = useRef<ExplanationSheetHandle>(null);
  // The tab bar covers the sheets' bottom strip; they pad their content by it.
  // Context, not useBottomTabBarHeight(), which throws outside a navigator.
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;

  const {
    complete,
    submitting: completing,
    mentorReaction: completionReaction,
    safetyFlag: completionSafety,
    clearReaction: clearCompletionReaction,
  } = useCompleteTask((taskId, hasReaction) => {
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
    if (!hasReaction) {
      explanationRef.current?.close();
      setActiveTask(null);
    }
  });

  // Reset state on OPEN, never on gorhom's onClose — that callback fires
  // spuriously (incl. several times on mount), so tying cleanup to it wiped the
  // acting task out from under the open sheet.
  //
  // The sheet opens one frame after the clear. Clearing and expanding in the
  // same handler let the expand animation start before the cleared state had
  // rendered, so a sheet could open on the previous task's mentor reaction.
  const openComplete = (task: TaskItem) => {
    clearCompletionReaction();
    actingTaskRef.current = task;
    setActiveTask(task);
    requestAnimationFrame(() => completionRef.current?.open());
  };

  const openExplain = (task: TaskItem) => {
    clearExplanationReaction();
    actingTaskRef.current = task;
    setActiveTask(task);
    requestAnimationFrame(() => explanationRef.current?.open());
  };

  // Let the full-screen modal finish fading before the bottom sheet animates
  // in, so the two transitions don't fight.
  //
  // First answer wins. `setAskTask(null)` only hides the modal on the next
  // render, so "Yes" then "Not today" inside 200 ms used to schedule both
  // timers, open both sheets, and race complete() against explain() on the
  // same task. The timer is also cleared on unmount.
  const answerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (answerTimer.current) clearTimeout(answerTimer.current);
    },
    [],
  );
  const answer = (task: TaskItem, open: (t: TaskItem) => void) => {
    if (answerTimer.current) return;
    setAskTask(null);
    answerTimer.current = setTimeout(() => {
      answerTimer.current = null;
      open(task);
    }, 200);
  };
  // Today-screen tap: `?goalId&taskId` drills into the goal, then opens that
  // task's answer moment once its tasks load. Params are cleared after use so
  // coming back to the tab doesn't re-open it; the next tap sets them again.
  const { goalId: linkGoalId, taskId: linkTaskId } =
    useLocalSearchParams<{ goalId?: string; taskId?: string }>();
  useEffect(() => {
    if (linkGoalId) setSelectedGoalId(linkGoalId);
  }, [linkGoalId]);
  useEffect(() => {
    const task = linkTaskId && tasks.find((t: TaskItem) => t.id === linkTaskId);
    if (!task) return;
    if (task.status === 'pending') setAskTask(task);
    router.setParams({ goalId: undefined, taskId: undefined });
  }, [linkTaskId, tasks]);

  const answerYes = (task: TaskItem) => answer(task, openComplete);
  const answerNotToday = (task: TaskItem) => answer(task, openExplain);

  // Memoized so the list row renderers below can be stable callbacks.
  const s = useMemo(
    () =>
      StyleSheet.create({
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
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
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
    pausedBadge: { backgroundColor: colors.notificationInfo },
    awayCard: { opacity: 0.7, borderStyle: 'dashed', borderWidth: 1 },
    awayBanner: {
      marginHorizontal: space['4'],
      marginBottom: space['3'],
      padding: space['4'],
      borderRadius: radius.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
      backgroundColor: colors.canvas,
      gap: space['2'],
    },
    lifecycleRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: space['5'],
      paddingVertical: space['4'],
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
      }),
    [colors, space, radius],
  );

  // ── Goal card (list level) ──
  // useCallback: both FlatLists got a new renderItem identity on every render
  // of a screen that also holds two sheets and a modal.
  const renderGoal = useCallback(({ item }: { item: ApiGoal }) => {
    const away = item.status !== 'active';
    return (
    <TouchableOpacity
      // A goal that's out of play reads as such at a glance: dimmed card,
      // dashed edge, and its status in words.
      style={[s.card, s.goalCard, away && s.awayCard]}
      onPress={() => setSelectedGoalId(item.id)}
      accessibilityRole="button"
      accessibilityLabel={
        away
          ? `Open goal ${item.title}, ${GOAL_STATUS_LABEL[item.status]}`
          : `Open goal ${item.title}`
      }
    >
      <View style={{ flex: 1 }}>
        <Text variant="title" color={away ? 'textMuted' : 'text'}>
          {item.title}
        </Text>
        {item.description ? (
          <Text variant="muted" numberOfLines={2} style={{ marginTop: space['1'] }}>
            {item.description}
          </Text>
        ) : null}
        <View style={[s.goalStatusBadge, item.status === 'paused' && s.pausedBadge]}>
          <Text variant="eyebrow" color={item.status === 'paused' ? 'text' : 'textMuted'}>
            {GOAL_STATUS_LABEL[item.status] ?? item.status}
          </Text>
        </View>
      </View>
      <Text variant="title" color="textMuted" style={s.chevron}>
        ›
      </Text>
    </TouchableOpacity>
    );
  }, [s, space]);

  // ── Task card (drilled-in level) ──
  const goalInPlay = selectedGoal?.status === 'active';
  const renderTask = useCallback(({ item }: { item: TaskItem }) => {
    // A paused or let-go goal's tasks are history until it's back in play.
    const isPending = item.status === 'pending' && goalInPlay;
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

        <View style={s.cardFooter}>
          {isPending ? (
            <Text variant="eyebrow" color="textMuted">
              tap to answer ›
            </Text>
          ) : (
            <View />
          )}
          <TouchableOpacity
            onPress={() => openEdit('task', item.id, item.goalId)}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${item.title}`}
            hitSlop={12}
          >
            <Text variant="eyebrow" color="textMuted">
              edit
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [s, space, colors, goalInPlay]);

  // ── Drilled-in view: one goal's tasks ──
  if (selectedGoal) {
    const away = AWAY_COPY[selectedGoal.status];
    const letGo = () =>
      Alert.alert(
        'Let this goal go?',
        'It leaves today and your mentor stops nudging you about it. You can bring it back from Goals.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Let it go',
            style: 'destructive',
            onPress: () => setStatus(selectedGoal.id, 'archived'),
          },
        ],
      );
    // Pause / Let it go aren't only for the 3rd miss: you can step away from
    // a goal whenever you choose to.
    const lifecycleControls = goalInPlay ? (
      <View style={s.lifecycleRow}>
        <Button
          label="pause this goal"
          variant="link"
          onPress={() => setStatus(selectedGoal.id, 'paused')}
          disabled={updatingStatus}
        />
        <Button label="let it go" variant="link" onPress={letGo} disabled={updatingStatus} />
      </View>
    ) : null;

    return (
      <Screen padded={false} edges={['top']}>
        <View style={s.backRow}>
          <TouchableOpacity
            onPress={() => setSelectedGoalId(null)}
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
          right={
            <TouchableOpacity
              onPress={() => openEdit('goal', selectedGoal.id)}
              accessibilityRole="button"
              accessibilityLabel="Edit this goal"
              hitSlop={12}
            >
              <Text variant="label" color="textMuted">
                edit
              </Text>
            </TouchableOpacity>
          }
          style={{ paddingHorizontal: space['5'], marginBottom: space['3'] }}
        />

        {away ? (
          <View style={s.awayBanner} accessibilityRole="summary">
            <Text variant="title">{away.title}</Text>
            <Text variant="muted">{away.body}</Text>
            <Button
              label={away.cta}
              onPress={() => setStatus(selectedGoal.id, 'active')}
              loading={updatingStatus}
              disabled={updatingStatus}
            />
          </View>
        ) : null}

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
            {lifecycleControls}
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(t) => t.id}
            renderItem={renderTask}
            contentContainerStyle={s.list}
            ListFooterComponent={lifecycleControls}
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
          bottomInset={tabBarHeight}
          taskTitle={activeTask?.title}
          personalityId={personalityId}
          submitting={completing}
          mentorReaction={completionReaction}
          safetyFlag={completionSafety}
          onSubmit={(payload) => {
            const t = actingTaskRef.current;
            if (t) complete(t.id, payload);
          }}
          onClose={() => completionRef.current?.close()}
        />

        <ExplanationSheet
          ref={explanationRef}
          bottomInset={tabBarHeight}
          taskTitle={activeTask?.title}
          personalityId={personalityId}
          submitting={explaining}
          mentorReaction={explanationReaction}
          safetyFlag={explanationSafety}
          missCountThisWeek={missCountThisWeek}
          onSubmit={(payload) => {
            const t = actingTaskRef.current;
            if (t) explain(t.id, payload);
          }}
          onGoalAction={(action) =>
            setStatus(selectedGoal.id, action === 'pause' ? 'paused' : 'archived')
          }
          onClose={() => explanationRef.current?.close()}
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
