import React from "react";
import { Stack } from "expo-router";
import { ROUTE_NAMES } from "@/constants/Routes";

export default function ReviewLayout() {
  return (
    <Stack>
      <Stack.Screen
        name={ROUTE_NAMES.REVIEW.REVIEW_SCREEN}
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
