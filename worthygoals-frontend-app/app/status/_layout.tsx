import React from "react";
import { Stack } from "expo-router";
import { ROUTE_NAMES } from "@/constants/Routes";

export default function StatusLayout() {
  return (
    <Stack>
      <Stack.Screen
        name={ROUTE_NAMES.STATUS.COMPOSE_SCREEN}
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
