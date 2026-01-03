import React, { useEffect } from "react";
import { View } from "react-native";
import { useNavigation } from "expo-router";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { ROUTE_NAMES } from "@/constants";

export default function ChatSettingsRedirect() {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const route = useRoute() as any;
  const mentorId = route?.params?.mentorId;

  useEffect(() => {
    if (!mentorId) return;
    navigation.replace(ROUTE_NAMES.MENTORS.self, {
      screen: ROUTE_NAMES.MENTORS.MENTOR_DETAIL_SCREEN,
      params: { mentorId },
    });
  }, [mentorId]);

  return <View />;
}
