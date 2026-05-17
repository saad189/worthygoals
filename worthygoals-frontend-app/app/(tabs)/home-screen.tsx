import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import Header from "@/components/SubComponents/Header";
import Background from "@/components/SubComponents/Background";
import { LinearGradient } from "expo-linear-gradient";
import WeeklyDatePicker from "@/components/CalenderView";
import BorderGradient from "@/components/Common/BorderGradient";
import { useAppTheme } from "@/hooks/useAppTheme";
import useDashboard from "@/hooks/useDashboard";
import { GoalSummary } from "@/services/dashboard.service";

const { width } = Dimensions.get("window");

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const categoryBorderColor = (
  category: string,
  colors: ReturnType<typeof useAppTheme>["colors"]
) => {
  switch (category.toLowerCase()) {
    case "knowledge":
      return colors.goalCategoryBlue;
    case "spiritual":
      return colors.goalCategoryPurple;
    default:
      return colors.goalCategoryPink;
  }
};

const DashboardScreen = () => {
  const { colors } = useAppTheme();
  const { data, loading, refreshing, refresh } = useDashboard();

  const goals = data?.goals ?? [];
  const weekCompletions = data?.weekCompletions ?? Array(7).fill(0);
  const todayProgress = data?.todayProgress ?? { completed: 0, total: 0 };
  const goalsPercentage =
    todayProgress.total === 0
      ? 0
      : Math.round((todayProgress.completed / todayProgress.total) * 100);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        todayText: {
          fontFamily: "Outfit",
          fontSize: 20,
          color: colors.primary,
          fontWeight: "500",
          paddingVertical: 12,
          textAlign: "center",
        },
        goalsTitle: {
          color: colors.textWhite,
          fontSize: 14,
          fontWeight: "500",
        },
        goalsSubtitle: {
          color: colors.textWhite,
          fontSize: 12,
          marginTop: 4,
        },
        goalsPercentage: {
          position: "absolute",
          left: Platform.OS === "ios" ? "25%" : "28%",
          bottom: "30%",
          fontSize: 28,
          color: colors.textWhite,
        },
        card: {
          width: width / 2.3,
          height: width / 2.3,
          backgroundColor: colors.cardSurface,
          borderRadius: 12,
          padding: 16,
          justifyContent: "space-around",
        },
        cardTitle: {
          marginTop: 20,
          color: colors.textWhite,
          fontSize: 16,
          fontWeight: "400",
        },
        cardStreak: {
          width: "60%",
          borderRadius: 12,
          backgroundColor: colors.badgeSurface,
          color: colors.textWhite,
          fontSize: 12,
          marginVertical: 4,
          paddingHorizontal: 10,
          paddingVertical: 3,
          textAlign: "center",
        },
        cardProgress: {
          color: colors.textWhite,
          fontSize: 16,
          marginBottom: 8,
          fontWeight: "400",
        },
        subHeading: {
          fontSize: 16,
          color: colors.textWhite,
          fontWeight: "600",
          marginVertical: 8,
        },
        emptyText: {
          color: colors.textMuted,
          fontSize: 14,
          textAlign: "center",
          paddingVertical: 24,
        },
        weekBar: {
          flex: 1,
          alignItems: "center",
          gap: 4,
        },
        weekBarFill: {
          width: 20,
          borderRadius: 4,
          backgroundColor: colors.primary,
        },
        weekBarEmpty: {
          width: 20,
          height: 4,
          borderRadius: 4,
          backgroundColor: colors.border,
        },
        weekLabel: {
          fontSize: 11,
          color: colors.textMuted,
          fontWeight: "500",
        },
      }),
    [colors]
  );

  const maxWeek = Math.max(...weekCompletions, 1);

  const renderGoalCard = (goal: GoalSummary, i: number) => (
    <BorderGradient
      borderWidth={2}
      colors={[
        categoryBorderColor(goal.category, colors),
        colors.gradientTerminal,
      ]}
      key={goal.id}
      start={{ x: i % 2 === 0 ? 1 : 0, y: i % 2 === 0 ? 1 : 0 }}
      end={{ x: i % 2 === 1 ? 1 : 0, y: i % 2 === 0 ? 1 : 0 }}
      outerStyle={{ marginVertical: 5 }}
    >
      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.cardTitle} numberOfLines={2}>
          {goal.title}
        </Text>
        <Text style={dynamicStyles.cardStreak}>
          🔥 {goal.currentStreak} day streak
        </Text>
        <Text style={dynamicStyles.cardProgress}>
          {goal.completedTodayCount}/{goal.todayTaskCount} today
        </Text>
      </View>
    </BorderGradient>
  );

  return (
    <Background style={staticStyles.container}>
      <ScrollView
        style={staticStyles.scrollView}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ alignSelf: "flex-start" }}>
          <Header>Welcome to Evolve</Header>
        </View>

        <WeeklyDatePicker />

        {/* Week completion strip */}
        <View style={staticStyles.weekStrip}>
          {weekCompletions.map((count, idx) => (
            <View key={idx} style={dynamicStyles.weekBar}>
              {count > 0 ? (
                <View
                  style={[
                    dynamicStyles.weekBarFill,
                    { height: Math.max(4, Math.round((count / maxWeek) * 32)) },
                  ]}
                />
              ) : (
                <View style={dynamicStyles.weekBarEmpty} />
              )}
              <Text style={dynamicStyles.weekLabel}>{DAY_LABELS[idx]}</Text>
            </View>
          ))}
        </View>

        {/* Daily progress card */}
        <View style={staticStyles.goalsContainer}>
          <LinearGradient
            colors={[colors.gradientProgressStart, colors.gradientProgressEnd]}
            style={staticStyles.goalsCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={staticStyles.goalsContent}>
              <View style={staticStyles.goalsPercentageContainer}>
                <Text style={dynamicStyles.goalsPercentage}>
                  {goalsPercentage}
                  <Text style={{ color: colors.textWhite, fontSize: 15 }}>%</Text>
                </Text>
              </View>
              <View style={staticStyles.goalsTextContainer}>
                <Text style={dynamicStyles.goalsTitle}>
                  {todayProgress.total === 0
                    ? "No tasks scheduled for today."
                    : "Great! Keep your daily streak alive."}
                </Text>
                <Text style={dynamicStyles.goalsSubtitle}>
                  {todayProgress.completed}/{todayProgress.total} Completed
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={{ alignSelf: "flex-start", marginBottom: 5 }}>
          <Text style={dynamicStyles.todayText}>TODAY</Text>
        </View>

        {loading && !data ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : goals.length === 0 ? (
          <Text style={dynamicStyles.emptyText}>
            No active goals yet.{"\n"}Create a goal to get started.
          </Text>
        ) : (
          <View style={staticStyles.cardsContainer}>
            {goals.map((goal, i) => renderGoalCard(goal, i))}
          </View>
        )}
      </ScrollView>
    </Background>
  );
};

export default DashboardScreen;

const staticStyles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },
  goalsContainer: { marginBottom: 20, marginHorizontal: 4 },
  goalsCardGradient: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
    paddingVertical: 14,
  },
  goalsContent: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  goalsTextContainer: { marginLeft: 12 },
  goalsPercentageContainer: {
    flexDirection: "row",
    width: width * 0.22,
    height: width * 0.22,
    borderRadius: width * 0.11,
    borderWidth: 2,
    borderColor: "white",
    alignItems: "center",
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  weekStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 4,
    marginBottom: 16,
    height: 52,
  },
});
