/**
 * Status compose · "tell the team" (Hi-Fi flow ⑤ · screen 12).
 * One line, no formatting. The three mentors listen at the bottom; on Send the
 * status fans out to one in-voice reaction each (the polyphonic feed).
 * The photo chip attaches one picture through the media presign path (S47);
 * voice note + location chips from the design stay future work.
 */
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

import { Button, Header, MentorAvatar, Screen, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCreateStatus } from '@/hooks/useCreateStatus';
import { mediaService } from '@/services/media.service';
import { PERSONALITIES } from '@/constants/Personalities';

const MAX_IMAGE_DIMENSION = 1024;

export default function StatusComposeScreen() {
  const { colors, space, radius, fonts, fontSizes } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const [text, setText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const { post, submitting, error } = useCreateStatus(() => {
    navigation.goBack();
  });

  const canSend = text.trim().length >= 3 && !submitting && !photoUploading;

  // Same pick → resize → presign-upload path as the completion sheet's
  // memory picture.
  const pickAndUploadPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to attach a picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setPhotoUploading(true);
    try {
      const resized = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: Math.min(asset.width ?? MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION) } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      const fileName = `status_${Date.now()}.jpg`;
      const { uploadUrl, mediaId: newMediaId } = await mediaService.requestUploadUrl(
        fileName,
        'image/jpeg',
        resized.width,
        resized.height,
      );
      await mediaService.uploadToPresignedUrl(uploadUrl, resized.uri, 'image/jpeg');
      setPhotoUri(resized.uri);
      setMediaId(newMediaId);
    } catch {
      Alert.alert('Upload failed', 'Could not attach the photo. Try again.');
    } finally {
      setPhotoUploading(false);
    }
  }, []);

  const removePhoto = useCallback(() => {
    setPhotoUri(null);
    setMediaId(null);
  }, []);

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

        {/* Screen 12's photo chip — one picture, shown as a small proof
            thumbnail once uploaded. */}
        <View style={[styles.chipRow, { marginTop: space['4'] }]}>
          {photoUri ? (
            <View style={styles.chipRow}>
              <Image
                source={{ uri: photoUri }}
                style={{
                  width: 56,
                  height: 42,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                accessibilityLabel="Attached photo"
              />
              <Pressable
                onPress={removePhoto}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                style={{ marginLeft: space['3'] }}
              >
                <Text variant="muted">remove</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={pickAndUploadPhoto}
              disabled={submitting || photoUploading}
              accessibilityRole="button"
              accessibilityLabel="Attach a photo"
              style={{
                paddingVertical: space['2'],
                paddingHorizontal: space['4'],
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Text variant="muted">
                {photoUploading ? 'uploading…' : '📷 photo'}
              </Text>
            </Pressable>
          )}
        </View>

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
            onPress={() => post(text.trim(), mediaId ?? undefined)}
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
  chipRow: { flexDirection: 'row', alignItems: 'center' },
  avatars: { flexDirection: 'row' },
});
