/**
 * Status compose · "tell the team" (Hi-Fi flow ⑤ · screen 12).
 * One line, no formatting. The three mentors listen at the bottom; on Send the
 * status fans out to one in-voice reaction each (the polyphonic feed).
 */
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

import { Button, Header, MentorAvatar, Screen, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCreateStatus } from '@/hooks/useCreateStatus';
import { PERSONALITIES } from '@/constants/Personalities';

export default function StatusComposeScreen() {
  const { colors, space, radius, fonts, fontSizes } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const [text, setText] = useState('');

  const { post, submitting, error } = useCreateStatus(() => {
    navigation.goBack();
  });

  const canSend = text.trim().length >= 3 && !submitting;

  return (
    <Screen scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.topRow}>
          <Header eyebrow="STATUS" title="tell the team." style={styles.noMargin} />
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            disabled={submitting}
          >
            <Text variant="muted">cancel</Text>
          </Pressable>
        </View>

        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          editable={!submitting}
          placeholder="wrote 500 words today. skipped the run."
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Write your status"
          style={{
            fontFamily: fonts.serifItalic,
            fontStyle: 'italic',
            fontSize: fontSizes.lg,
            lineHeight: fontSizes.lg * 1.5,
            color: colors.text,
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.textMuted,
            padding: space['4'],
            minHeight: 130,
            marginTop: space['6'],
            textAlignVertical: 'top',
          }}
        />

        {error ? (
          <Text variant="muted" color="primary" style={{ marginTop: space['3'] }}>
            {error}
          </Text>
        ) : null}

        <View
          style={[
            styles.listeningRow,
            {
              marginTop: space['6'],
              paddingVertical: space['3'],
              paddingHorizontal: space['4'],
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Text variant="eyebrow">{submitting ? 'reacting' : 'listening'}</Text>
          <View style={styles.avatars}>
            {PERSONALITIES.map((p, i) => (
              <MentorAvatar
                key={p.slug}
                mentor={p.slug}
                size={26}
                style={i === 0 ? undefined : { marginLeft: -8 }}
              />
            ))}
          </View>
          <View style={styles.flex} />
          <Button
            label={submitting ? 'Sending…' : 'Send'}
            onPress={() => post(text.trim())}
            disabled={!canSend}
            loading={submitting}
            block={false}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  noMargin: { marginBottom: 0, flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  listeningRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatars: { flexDirection: 'row' },
});
