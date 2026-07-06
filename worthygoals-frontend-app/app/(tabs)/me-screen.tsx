/**
 * me tab (Q4 · Hi-Fi nav · E-5 · U8 · flow ⑥).
 *
 * Profile / settings. Replaces the placeholder identity (the "Conor McGregor"
 * avatar and hardcoded name "AI") with the real signed-in user, drawn from
 * `useAuth().userProfile`. Assembled from the U1 ui/ primitives + tokens — no
 * raw hex, no legacy dark surface.
 *
 * U8 grows the U2 stub (identity + sign-out) into the full on-brand settings
 * surface: an identity card, a YOUR TEAM group that surfaces the
 * onboarding-matched mentor + saved tone (tap-through to the team tab), and an
 * ABOUT group with the app version. Sign-out stays the closing accent CTA.
 */
import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Constants from "expo-constants";
import { router } from "expo-router";

import { Screen, Header, Card, Text, Button, MentorAvatar } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { APP_NAME } from "@/constants/Brand";
import { ROUTE_NAMES } from "@/constants/Routes";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { ToneKey } from "@/constants/Personalities";

const TONE_LABEL: Record<ToneKey, string> = {
  soft: "soft — gentle, steady",
  firm: "firm — direct, accountable",
  intense: "intense — loud, no excuses",
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** A single editorial settings row: mono label, value, and an optional tap. */
function SettingRow({
  label,
  value,
  onPress,
  last = false,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const { colors, space } = useAppTheme();
  const content = (
    <View
      style={[
        styles.row,
        {
          paddingVertical: space["3"],
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Text variant="eyebrow" color="textMuted">
        {label}
      </Text>
      <View style={styles.rowValue}>
        <Text variant="body" numberOfLines={1}>
          {value}
        </Text>
        {onPress ? (
          <Text variant="muted" style={{ marginLeft: space["2"] }}>
            ›
          </Text>
        ) : null}
      </View>
    </View>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
    >
      {content}
    </Pressable>
  ) : (
    content
  );
}

export default function MeScreen() {
  const { colors, space, radius } = useAppTheme();
  const { userProfile, logout } = useAuth();
  // Mentor + tone from the global profile (backend-derived), not local
  // onboarding storage — so they survive a reinstall and stay consistent with
  // the today screen and the goal's mentor.
  const { mentor: persona, tone } = useProfile();

  const fullName = [userProfile?.firstName, userProfile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName = fullName || userProfile?.email || "Your profile";
  const initials = initialsOf(fullName || userProfile?.email || "");

  const toneLabel = tone ? TONE_LABEL[tone as ToneKey] ?? tone : "not set";
  const version = Constants.expoConfig?.version ?? "1.0.0";

  const goToTeam = () =>
    router.push(
      `/${ROUTE_NAMES.TABS.self}/${ROUTE_NAMES.TABS.MENTORS_LIST_SCREEN}` as never,
    );

  // The motivational board — memory pictures land here (PRD V1). The Hi-Fi IA
  // has no board tab, so the me tab is its home.
  const goToBoard = () =>
    router.push(
      `/${ROUTE_NAMES.TABS.INSPIRATION.self}/${ROUTE_NAMES.TABS.INSPIRATION.DEFAULT_SCREEN}` as never,
    );

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

      {/* ── YOUR TEAM ─────────────────────────────────────────── */}
      <Text variant="eyebrow" color="textMuted" style={styles.groupLabel}>
        your team
      </Text>
      <Card onPress={goToTeam}>
        <View style={styles.mentorRow}>
          {persona ? (
            <MentorAvatar mentor={persona.slug} size={44} />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarSm,
                { backgroundColor: colors.canvas, borderRadius: radius.md },
              ]}
            >
              <Text variant="muted">?</Text>
            </View>
          )}
          <View style={[styles.identityText, { marginLeft: space["4"] }]}>
            <Text variant="title">{persona ? persona.name : "No mentor yet"}</Text>
            <Text variant="muted">
              {persona ? persona.role : "Finish onboarding to get matched"}
            </Text>
          </View>
          <Text variant="muted" style={{ marginLeft: space["2"] }}>
            ›
          </Text>
        </View>
      </Card>

      <Card style={{ marginTop: space["3"] }}>
        <SettingRow label="tone" value={toneLabel} last />
      </Card>

      {/* ── MEMORIES ──────────────────────────────────────────── */}
      <Text variant="eyebrow" color="textMuted" style={styles.groupLabel}>
        memories
      </Text>
      <Card>
        <SettingRow
          label="board"
          value="Your wins, on file"
          onPress={goToBoard}
          last
        />
      </Card>

      {/* ── ABOUT ─────────────────────────────────────────────── */}
      <Text variant="eyebrow" color="textMuted" style={styles.groupLabel}>
        about
      </Text>
      <Card>
        <SettingRow label="app" value={APP_NAME} />
        <SettingRow label="version" value={version} last />
      </Card>

      <View style={{ marginTop: space["6"] }}>
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
  mentorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSm: {
    width: 44,
    height: 44,
  },
  identityText: {
    flexShrink: 1,
    flexGrow: 1,
  },
  groupLabel: {
    marginTop: 28,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowValue: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    marginLeft: 16,
  },
});
