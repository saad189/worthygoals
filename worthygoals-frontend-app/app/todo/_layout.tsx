import React from "react";
import { Stack } from "expo-router";
import { ROUTE_NAMES } from "@/constants/Routes";

export default function TodoLayout() {
  return (
    <Stack>
      <Stack.Screen
        name={ROUTE_NAMES.TODO.TODO_CREATE_SCREEN}
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.TODO.TODO_EDIT_SCREEN}
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.TODO.TODO_DETAIL_SCREEN}
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
    </Stack>
  );
}
