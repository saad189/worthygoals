/**
 * Entry gate — silently checks the stored session and routes to auth when
 * there is none. Renders a quiet warm-paper beat while the check runs.
 */
import React, { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { router } from "expo-router";

import { Screen } from "@/components/ui";
import { useAuth } from "@/hooks";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function Index() {
  const { checkAuth } = useAuth();
  const { colors } = useAppTheme();

  useEffect(() => {
    checkAuth()
      .catch((error) => {
        console.log("Auth check failed:", (error as Error).message);
      })
      .then((result) => {
        if (!result) {
          router.replace("/auth/start-auth");
        }
      });
  }, []);

  return (
    <Screen center>
      <ActivityIndicator color={colors.textMuted} />
    </Screen>
  );
}
