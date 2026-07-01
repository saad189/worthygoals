/**
 * Task edit — Hi-Fi reskin of the legacy stub (S45 · P-E). Still a
 * placeholder surface (see todo-detail-screen); renders on-brand until a
 * real task editor is designed. No live navigation reaches it today.
 */
import React from "react";
import { useNavigation } from "expo-router";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase, useRoute } from "@react-navigation/native";

import { Button, Header, Screen, Text } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function TodoEditScreen() {
  const { space } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const route = useRoute() as any;
  const todoId = route?.params?.todoId ?? "";

  return (
    <Screen>
      <Header eyebrow="GOAL TASK" title="Edit task." style={{ marginTop: space["4"] }} />
      <Text variant="muted" style={{ marginBottom: space["4"] }}>
        This surface is a placeholder — goals and their tasks are shaped in the
        goal wizard for now.
      </Text>
      <Text variant="mono" style={{ marginBottom: space["6"] }}>
        {`TASK · ${String(todoId) || "—"}`}
      </Text>

      <Button label="← Back" variant="link" onPress={navigation.goBack} />
    </Screen>
  );
}
