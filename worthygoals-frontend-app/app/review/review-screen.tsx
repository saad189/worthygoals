/**
 * Worthy Goals — Weekly review (Hi-Fi flow ⑥, screen 15 · S43)
 * ─────────────────────────────────────────────────────────────
 * A per-goal accounting of the week: each goal's trend (this week vs last),
 * its delta, and the goal's own mentor reacting to it in voice. The danger
 * row (no completions this week) gets the rust accent — the one to talk about.
 * Reached from the dashboard's "THIS WEEK" header and, in the product, from the
 * in-voice Sunday push (screen 14 · already shipped as notification.weekly_review).
 */
import React from "react";
import { View, StyleSheet, RefreshControl, ViewStyle } from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Screen, Text, Card, Button, MentorAvatar } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useWeeklyReview } from "@/hooks/useWeeklyReview";
import { ROUTE_NAMES } from "@/constants/Routes";
import type { GoalWeekRow, WeekTrend } from "@/models";

function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";
  const month = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const sameMonth = start.getMonth() === end.getMonth();
  return sameMonth
    ? `${month(start)} ${start.getDate()} — ${end.getDate()}`
    : `${month(start)} ${start.getDate()} — ${month(end)} ${end.getDate()}`;
}

function TrendIcon({ trend, color }: { trend: WeekTrend; color: string }) {
  const path =
    trend === "up"
      ? "M2 10L6 6l3 3 3-5"
      : trend === "down"
        ? "M2 4l4 4 3-3 3 5"
        : "M2 7h10";
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path
        d={path}
        stroke={color}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** One goal's week. Calls useAppTheme(slug) so the commentary speaks in the
 *  mentor's own colour + type (Marcus ink/sans, Lyra blue/serif, Goggs rust/mono). */
function GoalReviewRow({ row }: { row: GoalWeekRow }) {
  const slug = row.mentorPersonalityId;
  const { colors, accent, space, radius, fonts } = useAppTheme(slug);

  const titleColor = row.danger ? colors.primary : colors.text;
  const metaColor = row.danger ? colors.primary : colors.textMuted;
  const trendColor = row.danger ? colors.primary : colors.text;

  const isGoggs = slug === "goggs";
  const isLyra = slug === "lyra";
  const commentaryStyle = isGoggs
    ? { color: accent, fontFamily: fonts.mono, letterSpacing: 0.3 }
    : isLyra
      ? { color: accent, fontFamily: fonts.serifItalic, fontStyle: "italic" as const }
      : { color: colors.text };

  const deltaLabel =
    row.delta > 0 ? `+${row.delta}` : row.delta < 0 ? `${row.delta}` : "—";

  const cardStyle: ViewStyle = {
    ...styles.row,
    ...(row.danger
      ? { backgroundColor: colors.primarySubtle, borderColor: colors.primary, borderWidth: 1 }
      : {}),
  };

  return (
    <Card style={cardStyle}>
      <View style={styles.rowTop}>
        <MentorAvatar mentor={slug} size={26} />
        <Text variant="label" style={[styles.rowTitle, { color: titleColor }]} numberOfLines={1}>
          {row.title}
        </Text>
        <Text variant="mono" style={{ color: metaColor, marginRight: space["2"] }}>
          {deltaLabel}
        </Text>
        <TrendIcon trend={row.trend} color={trendColor} />
      </View>
      <Text
        variant={isGoggs ? "mono" : "body"}
        style={[{ marginTop: space["2"] }, commentaryStyle, { borderRadius: radius.xs }]}
      >
        {row.commentary}
      </Text>
    </Card>
  );
}

const ReviewScreen = () => {
  const { colors, space } = useAppTheme();
  const { review, loading, refreshing, refetch } = useWeeklyReview();

  const goals = review?.goals ?? [];
  const eyebrow = review
    ? `WEEK ${review.weekNumber} · ${formatRange(review.weekStart, review.weekEnd)}`
    : "WEEKLY REVIEW";
  const sub = review
    ? `${review.onTrackCount} of ${review.totalGoals} on track`
    : "";

  return (
    <Screen
      scroll
      padded={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={colors.primary} />
      }
    >
      <View style={{ paddingHorizontal: space["5"] }}>
        {/* Header — eyebrow over the editorial "review." line, then the tally. */}
        <View style={styles.header}>
          <Text variant="eyebrow">{eyebrow}</Text>
          <Text variant="display" style={{ marginTop: space["1"] }}>
            review.
          </Text>
          {sub ? (
            <Text variant="muted" style={{ marginTop: space["1"] }}>
              {sub}
            </Text>
          ) : null}
        </View>

        {loading && !review ? (
          <Card>
            <Text variant="muted">Pulling your week together…</Text>
          </Card>
        ) : goals.length === 0 ? (
          <Card>
            <Text variant="muted">
              No goals yet. Set one to get your first weekly review.
            </Text>
          </Card>
        ) : (
          goals.map((row: GoalWeekRow) => (
            <GoalReviewRow key={row.goalId} row={row} />
          ))
        )}

        {goals.length > 0 ? (
          <View style={{ marginTop: space["4"] }}>
            <Button
              label="Set next week"
              onPress={() =>
                router.push(
                  `/${ROUTE_NAMES.TODO.self}/${ROUTE_NAMES.TODO.TODO_CREATE_SCREEN}` as never
                )
              }
            />
            <Button
              label="Adjust goals"
              variant="link"
              onPress={() =>
                router.push(
                  `/${ROUTE_NAMES.TABS.self}/${ROUTE_NAMES.TABS.TODO_LIST_SCREEN}` as never
                )
              }
            />
          </View>
        ) : null}

        <View style={{ height: space["20"] }} />
      </View>
    </Screen>
  );
};

export default ReviewScreen;

const styles = StyleSheet.create({
  header: { marginTop: 8, marginBottom: 20 },
  row: { marginBottom: 10 },
  rowTop: { flexDirection: "row", alignItems: "center" },
  rowTitle: { flex: 1, marginLeft: 10 },
});
