import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
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

const CRISIS_RESOURCES =
  "Your wellbeing matters far more than any goal. " +
  "You don't have to be okay, and you're not alone.\n\n" +
  "If you're in crisis:\n" +
  "• Call or text 988 (Suicide & Crisis Lifeline)\n" +
  "• Text HOME to 741741 (Crisis Text Line)\n" +
  "• International: findahelpline.com";

interface Props {
  taskTitle?: string;
  submitting: boolean;
  mentorReaction?: string | null;
  safetyFlag?: boolean;
  onSubmit: (payload: CompleteTaskPayload) => void;
  onClose: () => void;
}

export interface CompletionSheetHandle {
  open: () => void;
  close: () => void;
}

const CompletionSheet = forwardRef<CompletionSheetHandle, Props>(
  ({ taskTitle, submitting, mentorReaction, safetyFlag, onSubmit, onClose }, ref) => {
    const { colors, space, radius } = useAppTheme();
    const sheetRef = useRef<BottomSheet>(null);
    const [mood, setMood] = useState<1 | 2 | 3 | 4 | null>(null);
    const [reflection, setReflection] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [mediaId, setMediaId] = useState<string | null>(null);
    const [localCrisis, setLocalCrisis] = useState(false);

    const snapPoints = useMemo(() => ['75%'], []);

    const showingReaction = !submitting && !!mentorReaction && !safetyFlag && !localCrisis;
    const showingCrisis = safetyFlag || localCrisis;

    React.useImperativeHandle(ref, () => ({
      open: () => {
        setMood(null);
        setReflection('');
        setPhotoUri(null);
        setMediaId(null);
        setLocalCrisis(false);
        sheetRef.current?.expand();
      },
      close: () => {
        setLocalCrisis(false);
        sheetRef.current?.close();
      },
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
        backgroundColor: colors.surface,
      },
      scroll: {
        padding: space['5'],
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
        marginBottom: space['3'],
      },
      submitText: {
        fontSize: 15,
        fontWeight: '700',
      },
      notOkayBtn: {
        alignItems: 'center',
        paddingVertical: space['2'],
        marginBottom: space['2'],
      },
      notOkayText: {
        fontSize: 12,
        color: colors.textMuted,
        textDecorationLine: 'underline',
      },
      reactionCard: {
        margin: space['5'],
        padding: space['4'],
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.canvas,
      },
      reactionLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: colors.textMuted,
        marginBottom: space['2'],
      },
      reactionText: {
        fontSize: 15,
        color: colors.text,
        lineHeight: 22,
        fontStyle: 'italic',
        marginBottom: space['4'],
      },
      crisisText: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 22,
        marginBottom: space['4'],
      },
      doneBtn: {
        paddingVertical: space['3'],
        borderRadius: radius.md,
        alignItems: 'center',
        backgroundColor: colors.primary,
      },
      doneBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textWhite,
      },
    });

    const renderReactionView = () => (
      <View style={s.reactionCard}>
        <Text style={s.reactionLabel}>
          {showingCrisis ? 'Resources' : 'Your mentor says'}
        </Text>
        <Text style={showingCrisis ? s.crisisText : s.reactionText}>
          {showingCrisis
            ? CRISIS_RESOURCES
            : mentorReaction}
        </Text>
        <TouchableOpacity style={s.doneBtn} onPress={onClose}>
          <Text style={s.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );

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
          {showingReaction || showingCrisis ? (
            renderReactionView()
          ) : (
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
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

              <TouchableOpacity
                style={s.notOkayBtn}
                onPress={() => setLocalCrisis(true)}
              >
                <Text style={s.notOkayText}>I'm not okay</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

CompletionSheet.displayName = 'CompletionSheet';
export default CompletionSheet;
