import React from "react";
import { Stack } from "expo-router";
import { ROUTE_NAMES } from "@/constants/Routes";

export default function AccountLayout() {
  return (
    <Stack>
      <Stack.Screen
        name={ROUTE_NAMES.ACCOUNT.DELETE_ACCOUNT_SCREEN}
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
