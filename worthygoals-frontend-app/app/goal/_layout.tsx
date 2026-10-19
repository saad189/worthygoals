import React from "react";
import { useSlide } from '@/hooks/useMotion';
import { Stack } from "expo-router";
import { ROUTE_NAMES } from "@/constants/Routes";

export default function TodoLayout() {
  const slide = useSlide();
  return (
    <Stack>
      <Stack.Screen
        name={ROUTE_NAMES.GOAL.GOAL_CREATE_SCREEN}
        options={{ headerShown: false, animation: slide('slide_from_right') }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.GOAL.GOAL_PROPOSE_SCREEN}
        options={{ headerShown: false, animation: slide('slide_from_right') }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.GOAL.GOAL_PERSONALITY_SCREEN}
        options={{ headerShown: false, animation: slide('slide_from_right') }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.GOAL.GOAL_EDIT_SCREEN}
        options={{ headerShown: false, animation: slide('slide_from_right') }}
      />
    </Stack>
  );
}
