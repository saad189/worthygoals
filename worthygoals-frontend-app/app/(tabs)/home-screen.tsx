/**
 * Worthy Goals — Today-first dashboard (Hi-Fi flow ③, screen 07 · U3)
 * ─────────────────────────────────────────────────────────────
 * One vertical scroll, assembled from ui/ primitives + tokens:
 *   · header        — mono date eyebrow over the "today" display line
 *   · narration     — a mentor paces the day (the pacing layer §G) + progress ring
 *   · up next       — today's tasks, the day's queue
 *   · this week     — 7-day trend strip ("X of 7", continuity not streak)
 *   · listening      — the roster is here, tap through to the feed
 */
import React, { useMemo } from "react";
import { View, StyleSheet, RefreshControl, Pressable } from "react-native";
import type { ViewStyle } from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Screen, Text, Card, MentorAvatar, UserAvatar, ProgressRing } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import useDashboard from "@/hooks/useDashboard";
import { useProfile } from "@/hooks/useProfile";
import { ROUTE_NAMES } from "@/constants/Routes";
import { personaBySlug } from "@/constants/Personalities";
import type { TaskSummary, GoalSummary } from "@/services/dashboard.service";
import type { MentorId } from "@/components/ui";

// weekCompletions is indexed Mon=0 … Sun=6 (backend contract).
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const ROSTER: MentorId[] = ["marcus", "lyra", "goggs"];

/** JS getDay() (Sun=0) → Mon=0 … Sun=6 to match weekCompletions. */
function mondayIndex(date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

function formatDateEyebrow(date = new Date()): string {
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  const month = date.toLocaleDateString(undefined, { month: "short" });
  return `${weekday} · ${month} ${date.getDate()}`.toUpperCase();
}

function formatDueTime(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .toUpperCase();
}

/**
 * Client-derived pacing line. Voice stand-in until the backend exposes a real
 * per-mentor narration field (handoff) — kept mentor-neutral so it reads fine
 * under whichever mentor the user matched with.
 */
function narrationLine(remaining: number, total: number): string {
  if (total === 0) return "Nothing on the list. A quiet day — or a head start on tomorrow.";
  if (remaining === 0) return "All clear. You showed up today — that's the whole game.";
  if (remaining === 1) return "One left. Finish it before the day finishes you.";
  return `${remaining} on the list. One at a time, in order. Don't flip it.`;
}

const DashboardScreen = () => {
  const { colors, space } = useAppTheme();
  const { data, loading, refreshing, refresh } = useDashboard();

  // The mentor pacing the day comes from the global profile (derived from the
  // user's goals), so it's the real matched mentor and survives a reinstall.
  // Falls back to Marcus only until the profile/goals load.
  const { mentorSlug, user } = useProfile();
  const mentor = (mentorSlug ?? "marcus") as MentorId;
  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "";
  const mentorName = personaBySlug(mentor)?.name ?? "Marcus";

  const goals: GoalSummary[] = data?.goals ?? [];
  const tasks: TaskSummary[] = data?.todaysTasks ?? [];
  const weekCompletions = data?.weekCompletions ?? Array(7).fill(0);
  const todayProgress = data?.todayProgress ?? { completed: 0, total: 0 };

  const goalTitleById = useMemo(() => {
    const map = new Map<string, string>();
    goals.forEach((g) => map.set(g.id, g.title));
    return map;
  }, [goals]);

  const upNext = useMemo(
    () => tasks.filter((t) => t.status !== "completed"),
    [tasks]
  );

  const progress =
    todayProgress.total === 0 ? 0 : todayProgress.completed / todayProgress.total;
  const remaining = Math.max(0, todayProgress.total - todayProgress.completed);
  const daysActive = weekCompletions.filter((c) => c > 0).length;
  const todayIdx = mondayIndex();

  const renderTask = (task: TaskSummary) => {
    const due = formatDueTime(task.dueDate);
    const goalTitle = goalTitleById.get(task.goalId);
    const meta = [due, goalTitle].filter(Boolean).join(" · ");
    return (
      <Card
        key={task.id}
        style={styles.taskCard}
        onPress={() => router.push(`/${ROUTE_NAMES.TABS.self}/${ROUTE_NAMES.TABS.TODO_LIST_SCREEN}` as never)}
      >
        <View style={styles.taskRow}>
          <View style={[styles.taskTick, { borderColor: colors.border }]} />
          <View style={styles.taskBody}>
            <Text variant="label" numberOfLines={2}>
              {task.title}
            </Text>
            {meta ? (
              <Text variant="eyebrow" style={{ marginTop: space["1"] }}>
                {meta}
              </Text>
            ) : null}
          </View>
        </View>
      </Card>
    );
  };

  const listeningRowStyle: ViewStyle = {
    ...styles.listeningRow,
    borderTopColor: colors.border,
  };

  return (
    <Screen
      scroll
      padded={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={{ paddingHorizontal: space["5"] }}>
        {/* App-bar — date + title on the left, bell + avatar on the right
            (Hi-Fi screen 07). The avatar drills into the profile/settings tab;
            the bell is the notifications affordance (surface not yet built). */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text variant="eyebrow">{formatDateEyebrow()}</Text>
            <Text variant="display" style={{ marginTop: space["1"] }}>
              today
            </Text>
          </View>
          <View style={styles.appBarControls}>
            <View
              style={[styles.bellButton, { borderColor: colors.border }]}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Svg width={15} height={15} viewBox="0 0 14 14">
                <Path
                  d="M7 1.5a4 4 0 014 4v3l1.5 2H1.5L3 8.5v-3a4 4 0 014-4z"
                  stroke={colors.text}
                  strokeWidth={1.2}
                  fill="none"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Pressable
              onPress={() => router.push(`/${ROUTE_NAMES.TABS.self}/${ROUTE_NAMES.TABS.ME_SCREEN}` as never)}
              accessibilityRole="button"
              accessibilityLabel="Open your profile"
              style={({ pressed }) => pressed && { opacity: 0.7 }}
            >
              <UserAvatar name={userName} size={32} />
            </Pressable>
          </View>
        </View>

        {/* Narration + progress ring */}
        <Card style={styles.narrationCard}>
          <View style={styles.narrationTop}>
            <MentorAvatar mentor={mentor} size={36} />
            <Text variant="eyebrow" style={{ marginLeft: space["2"] }}>
              {mentorName.toUpperCase()}
            </Text>
          </View>
          <View style={styles.narrationBody}>
            <Text variant="display" style={styles.quote}>
              {narrationLine(remaining, todayProgress.total)}
            </Text>
            <ProgressRing progress={progress} size={68} style={{ marginLeft: space["4"] }}>
              <Text variant="title">{todayProgress.completed}</Text>
              <Text variant="eyebrow">of {todayProgress.total}</Text>
            </ProgressRing>
          </View>
        </Card>

        {/* Up next */}
        <Text variant="eyebrow" style={styles.sectionLabel}>
          UP NEXT
        </Text>
        {loading && !data ? (
          <Card style={styles.taskCard}>
            <Text variant="muted">Loading your day…</Text>
          </Card>
        ) : upNext.length === 0 ? (
          <Card style={styles.taskCard}>
            <Text variant="muted">
              {todayProgress.total === 0
                ? "Nothing scheduled. Add a goal to fill the day."
                : "Everything done. Rest is part of the work."}
            </Text>
          </Card>
        ) : (
          upNext.map(renderTask)
        )}

        {/* This week — continuity, not a streak (design flow ③). Each day is a
            tall cell: filled ink + check when active, bordered + bottom dot for
            today, hairline-bordered when still pending. */}
        <Pressable
          onPress={() => router.push(`/${ROUTE_NAMES.REVIEW.self}/${ROUTE_NAMES.REVIEW.REVIEW_SCREEN}` as never)}
          style={({ pressed }) => [styles.weekHeader, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Open the weekly review"
        >
          <Text variant="eyebrow">THIS WEEK</Text>
          <View style={styles.weekHeaderRight}>
            <Text variant="muted" style={styles.weekCount}>
              {daysActive} of 7
            </Text>
            <Text variant="eyebrow">REVIEW ›</Text>
          </View>
        </Pressable>
        <Card>
          <View style={styles.weekStrip}>
            {weekCompletions.map((count, idx) => {
              const done = count > 0;
              const isToday = idx === todayIdx;
              return (
                <View key={idx} style={styles.weekCol}>
                  <Text variant="eyebrow" color={isToday ? "text" : undefined}>
                    {DAY_LABELS[idx]}
                  </Text>
                  <View
                    style={[
                      styles.weekCell,
                      done
                        ? { backgroundColor: colors.text, borderColor: "transparent" }
                        : isToday
                          ? { backgroundColor: colors.canvas, borderColor: colors.text }
                          : { borderColor: colors.border },
                    ]}
                  >
                    {done ? (
                      <Svg width={16} height={16} viewBox="0 0 14 14">
                        <Path
                          d="M3 7.5l3 3 5-6"
                          stroke={colors.background}
                          strokeWidth={1.6}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    ) : isToday ? (
                      <View style={[styles.todayDot, { backgroundColor: colors.text }]} />
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Listening row — the roster lives here; tap through to the feed. */}
          <Pressable
            onPress={() => router.push(`/${ROUTE_NAMES.TABS.self}/${ROUTE_NAMES.TABS.FEED_SCREEN}` as never)}
            style={({ pressed }) => [listeningRowStyle, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Tell the team how it went"
          >
            <View style={styles.avatarStack}>
              {ROSTER.map((m, i) => (
                <MentorAvatar
                  key={m}
                  mentor={m}
                  size={28}
                  style={{ marginLeft: i === 0 ? 0 : -8 }}
                />
              ))}
            </View>
            <Text variant="muted" style={{ marginLeft: space["3"], flex: 1 }}>
              {ROSTER.length} listening — tell the team how it went
            </Text>
            <Text variant="eyebrow">›</Text>
          </Pressable>
        </Card>

        <View style={{ height: space["20"] }} />
      </View>
    </Screen>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  header: {
    marginTop: 8,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerText: { flex: 1, minWidth: 0 },
  appBarControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  narrationCard: { marginBottom: 24 },
  narrationTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  narrationBody: { flexDirection: "row", alignItems: "center" },
  quote: { flex: 1, fontSize: 22, lineHeight: 30 },
  sectionLabel: { marginBottom: 10, marginTop: 4 },
  taskCard: { marginBottom: 10 },
  taskRow: { flexDirection: "row", alignItems: "center" },
  taskTick: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    marginRight: 14,
  },
  taskBody: { flex: 1 },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 4,
    marginBottom: 10,
  },
  weekHeaderRight: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  weekCount: { fontStyle: "italic" },
  weekStrip: { flexDirection: "row", gap: 6 },
  weekCol: { flex: 1, alignItems: "center", gap: 6 },
  weekCell: {
    width: "100%",
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  todayDot: {
    position: "absolute",
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  listeningRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  avatarStack: { flexDirection: "row", alignItems: "center" },
});
