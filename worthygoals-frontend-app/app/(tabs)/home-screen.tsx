import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import Header from "@/components/SubComponents/Header";
import Background from "@/components/SubComponents/Background";
import { LinearGradient } from "expo-linear-gradient";
import WeeklyDatePicker from "@/components/CalenderView";
import BorderGradient from "@/components/Common/BorderGradient";
import { useAppTheme } from "@/hooks/useAppTheme";

const { width } = Dimensions.get("window");

const DashboardScreen = () => {
  const { colors } = useAppTheme();
  const [selectedDate, setSelectedDate] = useState("2023-10-14");

  type CardInfo = {
    id: number;
    title: string;
    dayStreak: number;
    progressCurrent: number;
    progressTotal: number;
    progressUnit: string;
    borderColor: string;
  };

  const cardsData: CardInfo[] = [
    {
      id: 1,
      title: "Reading Book",
      dayStreak: 8,
      progressCurrent: 3,
      progressTotal: 5,
      progressUnit: "pages",
      borderColor: colors.goalCategoryPink,
    },
    {
      id: 2,
      title: "Meditation",
      dayStreak: 4,
      progressCurrent: 8,
      progressTotal: 20,
      progressUnit: "min",
      borderColor: colors.goalCategoryBlue,
    },
    {
      id: 3,
      title: "Running",
      dayStreak: 2,
      progressCurrent: 12,
      progressTotal: 20,
      progressUnit: "min",
      borderColor: colors.goalCategoryPurple,
    },
    {
      id: 4,
      title: "Power Lifting",
      dayStreak: 8,
      progressCurrent: 12,
      progressTotal: 20,
      progressUnit: "min",
      borderColor: colors.goalCategoryPurple,
    },
  ];

  const goalsCompleted = 3;
  const totalGoals = 8;
  const goalsPercentage = Math.round((goalsCompleted / totalGoals) * 100);

  const dynamicStyles = useMemo(() => StyleSheet.create({
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
      fontSize: 18,
      fontWeight: "400",
    },
    cardDayStreak: {
      width: "40%",
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
      fontSize: 18,
      marginBottom: 8,
      fontWeight: "400",
    },
    cardProgressUnit: {
      color: colors.textWhite,
      fontSize: 11,
      marginBottom: 10,
      marginLeft: 10,
      fontWeight: "400",
      alignSelf: "flex-end",
    },
    addButton: {
      position: "absolute",
      right: "15%",
      bottom: "15%",
      width: "25%",
      height: "25%",
      borderRadius: 12,
      backgroundColor: colors.cardSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    addButtonText: {
      color: colors.textWhite,
      fontSize: 25,
      paddingBottom: 4,
    },
    subHeading: {
      fontSize: 16,
      color: colors.textWhite,
      fontWeight: "600",
      marginVertical: 8,
    },
  }), [colors]);

  return (
    <Background style={staticStyles.container}>
      <ScrollView
        style={staticStyles.scrollView}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View style={{ alignSelf: "flex-start" }}>
          <Header>Welcome to Evolve</Header>
        </View>

        <WeeklyDatePicker />

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
                  Great! Your daily Goals almost done.
                </Text>
                <Text style={dynamicStyles.goalsSubtitle}>
                  {goalsCompleted}/{totalGoals} Completed
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={{ alignSelf: "flex-start", marginBottom: 5 }}>
          <Text style={dynamicStyles.todayText}>TODAY</Text>
        </View>
        <View style={staticStyles.cardsContainer}>
          {cardsData.map((card, i) => (
            <BorderGradient
              borderWidth={2}
              colors={[card.borderColor, colors.gradientTerminal]}
              key={card.id}
              start={{ x: i % 2 == 0 ? 1 : 0, y: i % 2 == 0 ? 1 : 0 }}
              end={{ x: i % 2 == 1 ? 1 : 0, y: i % 2 == 0 ? 1 : 0 }}
              outerStyle={{ marginVertical: 5 }}
            >
              <View style={dynamicStyles.card}>
                <Text style={dynamicStyles.cardTitle}>{card.title}</Text>
                <Text style={dynamicStyles.cardDayStreak}>{card.dayStreak} days</Text>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={dynamicStyles.cardProgress}>
                    {card.progressCurrent} / {card.progressTotal}
                  </Text>
                  <Text style={dynamicStyles.cardProgressUnit}>
                    {card.progressUnit}
                  </Text>
                </View>

                <TouchableOpacity style={dynamicStyles.addButton}>
                  <Text style={dynamicStyles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </BorderGradient>
          ))}
        </View>
      </ScrollView>
    </Background>
  );
};

export default DashboardScreen;

const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  goalsContainer: {
    marginBottom: 20,
    marginHorizontal: 4,
  },
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
  goalsTextContainer: {
    marginLeft: 12,
  },
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
});
