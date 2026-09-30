import React from "react";
import { useSlide } from '@/hooks/useMotion';
import { Stack } from "expo-router";
import { ROUTE_NAMES } from "@/constants/Routes";

export default function MentorsLayout() {
  const slide = useSlide();
  return (
    <Stack>
      <Stack.Screen
        name={ROUTE_NAMES.MENTORS.MENTOR_DETAIL_SCREEN}
        options={{ headerShown: false, animation: slide('slide_from_right') }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.MENTORS.IMAGE_VIEWER}
        options={{
          headerShown: false,
          presentation: "transparentModal",
          animation: "fade",
        }}
      />
    </Stack>
  );
}
