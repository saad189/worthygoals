/**
 * Task detail — Hi-Fi reskin of the legacy stub (S45 · P-E). Still a
 * placeholder surface: tasks are completed from the goals tab (flow ④),
 * so this only renders on-brand until a real task detail is designed.
 * No live navigation reaches it today.
 */
import React from "react";
import { useNavigation } from "expo-router";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase, useRoute } from "@react-navigation/native";

import { Button, Header, Screen, Text } from "@/components/ui";
import { ROUTE_NAMES } from "@/constants";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function TodoDetailScreen() {
  const { space } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const route = useRoute() as any;
  const todoId = route?.params?.todoId ?? "";

  return (
    <Screen>
      <Header eyebrow="GOAL TASK" title="Task detail." style={{ marginTop: space["4"] }} />
      <Text variant="muted" style={{ marginBottom: space["4"] }}>
        This surface is a placeholder — tasks are checked off from the goals
        tab, where your mentor is watching.
      </Text>
      <Text variant="mono" style={{ marginBottom: space["6"] }}>
        {`TASK · ${String(todoId) || "—"}`}
      </Text>

      <Button
        label="Edit"
        variant="secondary"
        onPress={() =>
          navigation.navigate(ROUTE_NAMES.TODO.self, {
            screen: ROUTE_NAMES.TODO.TODO_EDIT_SCREEN,
            params: { todoId: todoId || "dummy" },
          })
        }
      />
      <Button label="← Back" variant="link" onPress={navigation.goBack} />
    </Screen>
  );
}
