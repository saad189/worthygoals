import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import Background from "@/components/SubComponents/Background";
import {
  ParamListBase,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ROUTE_NAMES } from "@/constants";

import mentorService from "@/services/mentor.service";
import { Mentor } from "@/models";

import CurrentGoalsComponent from "@/components/MentorSettings/CurrentGoals";
import NewGoalsComponent from "@/components/MentorSettings/NewGoals";
import AIPersonalitySettingsComponent from "@/components/MentorSettings/AIPersonalitySettings";
import DefaultSettingsComponent from "@/components/MentorSettings/DefaultSettings";
import Animated from "react-native-reanimated";
import { useAppTheme } from "@/hooks/useAppTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

enum Tabs {
  CURRENT_GOALS = "CurrentGoals",
  AI_PERSONALITY = "AIPersonality",
  SET_GOALS = "SetGoals",
  SETTINGS = "Settings",
}

type TabItem = {
  tabKey: Tabs;
  title: string;
  onPress: () => void;
  logo: any;
  logoActive?: any;
  component: React.FC;
};

const TabButton = ({
  onPress,
  logo,
  title,
  logoActive,
  isActive,
}: TabItem & { isActive: boolean }) => {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      style={[
        staticStyles.tabButton,
        { backgroundColor: isActive ? colors.primary : colors.textFaint },
      ]}
      onPress={onPress}
    >
      <Image
        source={isActive && logoActive ? logoActive : logo}
        style={{ width: SCREEN_WIDTH * 0.1, height: SCREEN_WIDTH * 0.11 }}
      />
      <Text
        style={[
          staticStyles.tabButtonText,
          isActive && { color: colors.textWhite },
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit={true}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

function MentorDetailScreen() {
  const { colors } = useAppTheme();
  const route = useRoute() as any;
  const mentorId = Number(route?.params?.mentorId);

  const [mentor, setMentor] = useState<Mentor>({
    id: 0,
    slug: "",
    name: "",
    shortDescription: "",
    personalityTraits: { energy: 90, focus: 80 },
    avatarUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOKOsPbE9WMa8ZO1iNNeFgoI0DWBjH8cMCwg&s",
  } as Mentor);

  const [selectedTab, setSelectedTab] = useState<Tabs>(Tabs.SETTINGS);

  useFocusEffect(
    useCallback(() => {
      if (!mentorId) return;
      mentorService.getMentorById(mentorId).then((data: Mentor | null) => {
        if (data) setMentor(data);
      });
    }, [mentorId])
  );

  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const mentorImageUri = mentor.avatarUrl || mentor.coverImageUrl || "";

  const tabItems: TabItem[] = [
    {
      tabKey: Tabs.CURRENT_GOALS,
      title: "Current Goals Status",
      onPress: () => setSelectedTab(Tabs.CURRENT_GOALS),
      logo: require("@/assets/images/icons/current_goals_icon.png"),
      logoActive: require("@/assets/images/icons/current_goals_active_icon.png"),
      component: CurrentGoalsComponent,
    },
    {
      tabKey: Tabs.AI_PERSONALITY,
      title: "AI Personality Settings",
      onPress: () => setSelectedTab(Tabs.AI_PERSONALITY),
      logo: require("@/assets/images/icons/ai_big_icon.png"),
      logoActive: require("@/assets/images/icons/ai_big_active_icon.png"),
      component: AIPersonalitySettingsComponent,
    },
    {
      tabKey: Tabs.SET_GOALS,
      title: "Set New Goals",
      onPress: () => setSelectedTab(Tabs.SET_GOALS),
      logo: require("@/assets/images/icons/new_goals_icon.png"),
      logoActive: require("@/assets/images/icons/new_goals_active_icon.png"),
      component: NewGoalsComponent,
    },
  ];

  const settingsTab: TabItem = {
    tabKey: Tabs.SETTINGS,
    title: "Settings",
    onPress: () => setSelectedTab(Tabs.SETTINGS),
    logo: require("@/assets/images/icons/settings_icon.png"),
    component: DefaultSettingsComponent,
  };

  const ActiveTabItem = tabItems.find((item) => item.tabKey === selectedTab);
  const ActiveComponent = ActiveTabItem
    ? ActiveTabItem.component
    : settingsTab.component;

  return (
    <SafeAreaView style={staticStyles.container}>
      <ScrollView>
        <View style={[staticStyles.profileContainer, { backgroundColor: colors.surfaceGlass }]}>
          <View style={staticStyles.topRow}>
            <TouchableOpacity
              onPress={navigation.goBack}
              style={{ marginLeft: 5 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
            </TouchableOpacity>

            <View style={staticStyles.profileImageWrapper}>
              <TouchableOpacity
                style={{ minWidth: 150, minHeight: 150 }}
                onPress={() => {
                  if (!mentorImageUri) return;
                  navigation.navigate(ROUTE_NAMES.MENTORS.IMAGE_VIEWER, {
                    imageUri: mentorImageUri,
                    tag: `${mentor.id}-tag`,
                  });
                }}
              >
                <Animated.Image
                  source={{ uri: mentorImageUri }}
                  sharedTransitionTag={`${mentor.id}-tag`}
                  style={staticStyles.profileImage}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={settingsTab.onPress}
              style={{ marginLeft: 5 }}
            >
              <Ionicons
                name="settings"
                size={24}
                color={
                  selectedTab == settingsTab.tabKey
                    ? colors.primary
                    : colors.textWhite
                }
              />
            </TouchableOpacity>
          </View>

          <View style={staticStyles.nameContainer}>
            <Text style={[staticStyles.nameText, { color: colors.mentorNameColor }]}>
              AI {mentor.name}
            </Text>
          </View>
        </View>

        <View style={[staticStyles.tabsContainer, { backgroundColor: colors.surfaceGlass }]}>
          {tabItems.map((tab) => (
            <TabButton
              key={tab.tabKey}
              {...tab}
              isActive={selectedTab === tab.tabKey}
            />
          ))}
        </View>

        <View style={staticStyles.contentContainer}>
          {ActiveComponent ? <ActiveComponent /> : null}
        </View>
        <View style={{ marginBottom: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function MentorDetailWithBackground() {
  return (
    <Background style={staticStyles.container}>
      <MentorDetailScreen />
    </Background>
  );
}

const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileContainer: {
    paddingTop: 50,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    alignItems: "center",
  },
  profileImageWrapper: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: "hidden",
    marginBottom: 10,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderRadius: 75,
  },
  nameContainer: {
    minHeight: "5%",
    width: "100%",
    alignItems: "center",
  },
  nameText: {
    fontSize: 26,
    fontWeight: "bold",
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    borderBottomEndRadius: 30,
    borderBottomLeftRadius: 30,
    paddingVertical: 20,
    marginBottom: 10,
  },
  tabButton: {
    paddingVertical: 8,
    width: SCREEN_WIDTH / 3.3,
    height: 100,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  tabButtonText: {
    fontWeight: "600",
    width: "75%",
    textAlign: "center",
    fontSize: 12,
  },
  contentContainer: {
    padding: 10,
    flex: 1,
  },
});
