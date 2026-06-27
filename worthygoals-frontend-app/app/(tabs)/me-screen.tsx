/**
 * me tab (Q4 · Hi-Fi nav · E-5).
 *
 * Profile / settings. Replaces the placeholder identity (the "Conor McGregor"
 * avatar and hardcoded name "AI") with the real signed-in user, drawn from
 * `useAuth().userProfile`. Assembled from the U1 ui/ primitives + tokens — no
 * raw hex, no legacy dark surface. The full settings surface lands in a later
 * flow; U2 establishes the tab with real identity + sign-out.
 */
import React from "react";
import { View, StyleSheet } from "react-native";

import { Screen, Header, Card, Text, Button } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { APP_NAME } from "@/constants/Brand";
import { useAuth } from "@/hooks/useAuth";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function MeScreen() {
  const { colors, space, radius } = useAppTheme();
  const { userProfile, logout } = useAuth();

  const fullName = [userProfile?.firstName, userProfile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName = fullName || userProfile?.email || "Your profile";
  const initials = initialsOf(fullName || userProfile?.email || "");

  return (
    <Screen scroll>
      <Header eyebrow={`${APP_NAME} · V1`} title="me." />

      <Card>
        <View style={styles.identity}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.text, borderRadius: radius.lg },
            ]}
          >
            <Text variant="title" color="textWhite">
              {initials}
            </Text>
          </View>
          <View style={[styles.identityText, { marginLeft: space["4"] }]}>
            <Text variant="title">{displayName}</Text>
            {!!userProfile?.email && fullName ? (
              <Text variant="muted">{userProfile.email}</Text>
            ) : null}
          </View>
        </View>
      </Card>

      <View style={{ marginTop: space["5"] }}>
        <Button label="Sign out" variant="accent" onPress={logout} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  identityText: {
    flexShrink: 1,
  },
});
