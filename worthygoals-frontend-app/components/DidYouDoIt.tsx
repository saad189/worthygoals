/**
 * "Did you do it?" — Hi-Fi flow ④, screen 08 (the recommended artboard).
 * The full-screen binary moment that intercepts a pending task tap before the
 * success / failure sheets open: one loud question, the mentor waiting, two
 * answers. "Single binary, loud. The kicker names the moment so the answer
 * feels weighed."
 */
import React from 'react';
import { Modal, StyleSheet, Pressable, View } from 'react-native';

import { Button, MentorAvatar, Screen, Text } from '@/components/ui';
import { personaBySlug } from '@/constants/Personalities';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  visible: boolean;
  taskTitle?: string;
  /** Personality slug of the goal's mentor; falls back to Marcus. */
  personalityId?: string | null;
  /** "Yes" — hands off to the success path (screen 09). */
  onYes: () => void;
  /** "Not today" — hands off to the failure path (screen 10). */
  onNotToday: () => void;
  /** Quiet escape for a mis-tap; the sheets stay unopened. */
  onDismiss: () => void;
};

export default function DidYouDoIt({
  visible,
  taskTitle,
  personalityId,
  onYes,
  onNotToday,
  onDismiss,
}: Props) {
  const { space } = useAppTheme();
  const persona = personaBySlug(personalityId ?? undefined) ?? personaBySlug('marcus')!;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Screen>
        <View style={styles.cancelRow}>
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Not now"
            hitSlop={12}
          >
            <Text variant="muted">not now</Text>
          </Pressable>
        </View>

        <View style={styles.center}>
          <Text variant="eyebrow" style={{ marginBottom: space['4'] }}>
            {`${taskTitle ?? 'your task'} · due now`}
          </Text>
          <Text variant="display" style={styles.question}>
            Did you do it?
          </Text>

          <View style={[styles.kickerRow, { marginTop: space['6'], gap: space['3'] }]}>
            <MentorAvatar mentor={persona.slug} size={28} />
            <Text variant="muted">
              {`${persona.name.toLowerCase()} is waiting for the answer.`}
            </Text>
          </View>
        </View>

        <View style={{ paddingBottom: space['4'], gap: space['3'] }}>
          <Button label="Yes" onPress={onYes} />
          <Button label="Not today" variant="secondary" onPress={onNotToday} />
        </View>
      </Screen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cancelRow: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  question: { textAlign: 'center' },
  kickerRow: { flexDirection: 'row', alignItems: 'center' },
});
