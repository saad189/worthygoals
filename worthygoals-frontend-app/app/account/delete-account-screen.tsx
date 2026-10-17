/**
 * Delete account — reached from the me tab's ACCOUNT group.
 *
 * App Store guideline 5.1.1(v): an app that lets people create an account must
 * let them delete it from inside the app. The backend (DELETE /users/me) was
 * already complete — DB rows cascade, the Cognito identity and uploaded photos
 * are removed — but no screen called it.
 *
 * Irreversible, so the CTA stays disabled until the user types "delete". On
 * success the local sign-out cleanup runs (tokens, cache, outbox, onboarding)
 * and the auth guard redirects to start-auth.
 */
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { Screen, Header, Card, Text, Button, Field } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import userService from "@/services/UserService";

const CONFIRM_WORD = "delete";

const ERASED = [
  "Your profile and sign-in",
  "Every goal, task and streak",
  "Your reflections, memory pictures and status posts",
  "Your conversations with your mentors",
];

export default function DeleteAccountScreen() {
  const { space } = useAppTheme();
  const { logout } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const confirmed = confirmText.trim().toLowerCase() === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!confirmed || deleting) return;
    setDeleting(true);
    setError("");
    try {
      await userService.deleteAccount();
    } catch (e: any) {
      setError(e?.message || "Couldn't delete your account. Try again.");
      setDeleting(false);
      return;
    }
    // The account is gone; nothing left to retry. Logout never throws.
    await logout({ accountDeleted: true });
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <Header
          eyebrow="account"
          title="Delete your account."
          onBack={deleting ? undefined : () => router.back()}
        />

        <Text variant="body">
          This permanently erases your account. It can't be undone, and your
          mentors won't remember you.
        </Text>

        <Text variant="eyebrow" color="textMuted" style={styles.groupLabel}>
          what goes
        </Text>
        <Card>
          {ERASED.map((item) => (
            <Text key={item} variant="body" style={{ paddingVertical: space["1"] }}>
              — {item}
            </Text>
          ))}
        </Card>

        <View style={{ marginTop: space["6"] }}>
          <Field
            label={`Type "${CONFIRM_WORD}" to confirm`}
            value={confirmText}
            onChangeText={(t: string) => {
              setConfirmText(t);
              if (error) setError("");
            }}
            autoCapitalize="none"
            autoCorrect={false}
            disabled={deleting}
            errorText={error}
            returnKeyType="done"
            onSubmitEditing={handleDelete}
          />
        </View>

        <Button
          label="Delete my account"
          variant="accent"
          onPress={handleDelete}
          disabled={!confirmed}
          loading={deleting}
        />
        <Button
          label="Keep my account"
          variant="link"
          onPress={() => router.back()}
          disabled={deleting}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  groupLabel: {
    marginTop: 28,
    marginBottom: 10,
  },
});
