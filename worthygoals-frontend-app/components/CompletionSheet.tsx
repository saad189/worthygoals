import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAppTheme } from '@/hooks/useAppTheme';
import { CompleteTaskPayload } from '@/models';
import { mediaService } from '@/services/media.service';

const MOODS: { score: 1 | 2 | 3 | 4; emoji: string; label: string }[] = [
  { score: 1, emoji: '😣', label: 'Tough' },
  { score: 2, emoji: '😐', label: 'Okay' },
  { score: 3, emoji: '🙂', label: 'Good' },
  { score: 4, emoji: '🔥', label: 'Great' },
];

const MAX_IMAGE_DIMENSION = 1024;

interface Props {
  taskTitle?: string;
  submitting: boolean;
  onSubmit: (payload: CompleteTaskPayload) => void;
  onClose: () => void;
}

export interface CompletionSheetHandle {
  open: () => void;
  close: () => void;
}

const CompletionSheet = forwardRef<CompletionSheetHandle, Props>(
  ({ taskTitle, submitting, onSubmit, onClose }, ref) => {
    const { colors, space, radius } = useAppTheme();
    const sheetRef = useRef<BottomSheet>(null);
    const [mood, setMood] = useState<1 | 2 | 3 | 4 | null>(null);
    const [reflection, setReflection] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [mediaId, setMediaId] = useState<string | null>(null);

    const snapPoints = useMemo(() => ['70%'], []);

    React.useImperativeHandle(ref, () => ({
      open: () => {
        setMood(null);
        setReflection('');
        setPhotoUri(null);
        setMediaId(null);
        sheetRef.current?.expand();
      },
      close: () => sheetRef.current?.close(),
    }));

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      [],
    );

    const pickAndUploadPhoto = useCallback(async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo access to attach a memory picture.');
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

        const fileName = `photo_${Date.now()}.jpg`;
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
        Alert.alert('Upload failed', 'Could not attach photo. Try again.');
      } finally {
        setPhotoUploading(false);
      }
    }, []);

    const removePhoto = useCallback(() => {
      setPhotoUri(null);
      setMediaId(null);
    }, []);

    const handleSubmit = () => {
      if (!mood) return;
      onSubmit({
        moodScore: mood,
        reflection: reflection.trim() || undefined,
        memoryPictureId: mediaId ?? undefined,
      });
    };

    const s = StyleSheet.create({
      content: {
        flex: 1,
        padding: space['5'],
        backgroundColor: colors.surface,
      },
      title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: space['1'],
      },
      subtitle: {
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: space['5'],
      },
      moodRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: space['5'],
      },
      moodBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: space['3'],
        marginHorizontal: 4,
        borderRadius: radius.md,
        borderWidth: 2,
      },
      moodEmoji: { fontSize: 24 },
      moodLabel: { fontSize: 11, marginTop: 4 },
      input: {
        borderWidth: 1,
        borderRadius: radius.md,
        padding: space['3'],
        minHeight: 72,
        textAlignVertical: 'top',
        fontSize: 14,
        marginBottom: space['4'],
      },
      photoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: space['4'],
        gap: 10,
      },
      photoThumb: {
        width: 56,
        height: 56,
        borderRadius: radius.sm,
      },
      photoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: space['2'],
        paddingHorizontal: space['3'],
        borderRadius: radius.md,
        borderWidth: 1,
        gap: 6,
      },
      photoBtnText: {
        fontSize: 13,
        fontWeight: '500',
      },
      removeBtn: {
        paddingVertical: space['2'],
        paddingHorizontal: space['2'],
      },
      removeBtnText: {
        fontSize: 12,
      },
      submitBtn: {
        paddingVertical: space['4'],
        borderRadius: radius.md,
        alignItems: 'center',
      },
      submitText: {
        fontSize: 15,
        fontWeight: '700',
      },
    });

    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onClose={onClose}
        handleIndicatorStyle={{ backgroundColor: colors.border }}
        backgroundStyle={{ backgroundColor: colors.surface }}
      >
        <BottomSheetView style={s.content}>
          <Text style={s.title}>Mark as Done</Text>
          <Text style={s.subtitle} numberOfLines={1}>
            {taskTitle ?? 'Task'}
          </Text>

          <View style={s.moodRow}>
            {MOODS.map(({ score, emoji, label }) => {
              const selected = mood === score;
              return (
                <TouchableOpacity
                  key={score}
                  style={[
                    s.moodBtn,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primarySubtle : colors.canvas,
                    },
                  ]}
                  onPress={() => setMood(score)}
                >
                  <Text style={s.moodEmoji}>{emoji}</Text>
                  <Text style={[s.moodLabel, { color: selected ? colors.primary : colors.textMuted }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={[s.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.canvas }]}
            placeholder="Reflection (optional)"
            placeholderTextColor={colors.textFaint}
            value={reflection}
            onChangeText={setReflection}
            multiline
            maxLength={500}
          />

          <View style={s.photoRow}>
            {photoUri ? (
              <>
                <Image source={{ uri: photoUri }} style={s.photoThumb} />
                <TouchableOpacity style={s.removeBtn} onPress={removePhoto}>
                  <Text style={[s.removeBtnText, { color: colors.primary }]}>Remove</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[s.photoBtn, { borderColor: colors.border, backgroundColor: colors.canvas }]}
                onPress={pickAndUploadPhoto}
                disabled={photoUploading}
              >
                {photoUploading ? (
                  <ActivityIndicator size="small" color={colors.textMuted} />
                ) : (
                  <Text style={[s.photoBtnText, { color: colors.textMuted }]}>+ Photo</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: mood ? colors.primary : colors.border }]}
            onPress={handleSubmit}
            disabled={!mood || submitting || photoUploading}
          >
            {submitting ? (
              <ActivityIndicator color={colors.textWhite} />
            ) : (
              <Text style={[s.submitText, { color: colors.textWhite }]}>Submit</Text>
            )}
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

CompletionSheet.displayName = 'CompletionSheet';
export default CompletionSheet;
