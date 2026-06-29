import React, { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { MotiView } from 'moti';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Button, MentorAvatar, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { CompleteTaskPayload } from '@/models';
import { mediaService } from '@/services/media.service';
import { personaBySlug } from '@/constants/Personalities';
import { triggerPersonalityHaptic, triggerSelectionHaptic } from '@/helpers/haptics';

// Hi-Fi screen 09 (SUCCESS → REFLECT): mood + memory pic + in-voice reaction.
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
  personalityId?: string | null;
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
  ({ taskTitle, personalityId, submitting, mentorReaction, safetyFlag, onSubmit, onClose }, ref) => {
    const { colors, space, radius } = useAppTheme();
    const sheetRef = useRef<BottomSheet>(null);
    const [mood, setMood] = useState<1 | 2 | 3 | 4 | null>(null);
    const [reflection, setReflection] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [mediaId, setMediaId] = useState<string | null>(null);
    const [localCrisis, setLocalCrisis] = useState(false);

    const snapPoints = useMemo(() => ['78%'], []);

    const persona = personaBySlug(personalityId ?? undefined);
    const mentorName = persona?.name ?? 'Your mentor';

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
      triggerPersonalityHaptic(personalityId);
      onSubmit({
        moodScore: mood,
        reflection: reflection.trim() || undefined,
        memoryPictureId: mediaId ?? undefined,
        personalityId: personalityId ?? undefined,
      });
    };

    const handleMoodPress = (score: 1 | 2 | 3 | 4) => {
      triggerSelectionHaptic();
      setMood(score);
    };

    const s = StyleSheet.create({
      content: { flex: 1, backgroundColor: colors.surface },
      scroll: { padding: space['5'], paddingBottom: space['6'] },
      taskEyebrow: { marginTop: space['1'], marginBottom: space['5'] },
      sectionLabel: { marginBottom: space['3'] },
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
        borderWidth: 1.5,
      },
      moodEmoji: { fontSize: 26 },
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
        marginBottom: space['5'],
        gap: 10,
      },
      photoThumb: { width: 56, height: 56, borderRadius: radius.sm },
      photoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: space['3'],
        paddingHorizontal: space['4'],
        borderRadius: radius.md,
        borderWidth: 1,
        gap: 6,
      },
      removeBtn: { paddingVertical: space['2'], paddingHorizontal: space['2'] },
      notOkayBtn: { alignItems: 'center', paddingVertical: space['3'], marginTop: space['2'] },
      // ── In-voice reaction card ──
      reactionCard: {
        margin: space['5'],
        padding: space['4'],
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.canvas,
      },
      mentorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: space['3'] },
      reactionText: {
        fontStyle: 'italic',
        lineHeight: 24,
        marginBottom: space['4'],
      },
      crisisText: { lineHeight: 22, marginBottom: space['4'] },
    });

    const renderReactionView = () => (
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350 }}
        style={s.reactionCard}
      >
        <View style={s.mentorRow}>
          <MentorAvatar mentor={personalityId ?? 'marcus'} size={32} />
          <Text variant="eyebrow">{showingCrisis ? 'Resources' : mentorName}</Text>
        </View>
        <Text variant={showingCrisis ? 'body' : 'display'} style={showingCrisis ? s.crisisText : s.reactionText}>
          {showingCrisis ? CRISIS_RESOURCES : mentorReaction}
        </Text>
        <Button label="Close" onPress={onClose} />
      </MotiView>
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
              <Text variant="display">Done.</Text>
              <Text variant="eyebrow" style={s.taskEyebrow} numberOfLines={1}>
                {(taskTitle ?? 'Task').toUpperCase()} · LOGGED
              </Text>

              <Text variant="eyebrow" style={s.sectionLabel}>
                How did it feel?
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
                          borderColor: selected ? colors.text : colors.border,
                          backgroundColor: selected ? colors.canvas : colors.surface,
                        },
                      ]}
                      onPress={() => handleMoodPress(score)}
                      accessibilityLabel={`Mood: ${label}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text style={s.moodEmoji}>{emoji}</Text>
                      <Text
                        variant="label"
                        color={selected ? 'text' : 'textMuted'}
                        style={{ marginTop: 4, fontSize: 11 }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text variant="eyebrow" style={s.sectionLabel}>
                Memory · optional
              </Text>
              <View style={s.photoRow}>
                {photoUri ? (
                  <>
                    <Image source={{ uri: photoUri }} style={s.photoThumb} />
                    <TouchableOpacity style={s.removeBtn} onPress={removePhoto}>
                      <Text variant="label" color="primary">
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[s.photoBtn, { borderColor: colors.border, backgroundColor: colors.canvas }]}
                    onPress={pickAndUploadPhoto}
                    disabled={photoUploading}
                    accessibilityLabel="Attach a memory picture"
                    accessibilityRole="button"
                  >
                    {photoUploading ? (
                      <ActivityIndicator size="small" color={colors.textMuted} />
                    ) : (
                      <Text variant="label" color="textMuted">
                        + Photo
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
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

              <Button
                label="Mark it done"
                onPress={handleSubmit}
                loading={submitting}
                disabled={!mood || submitting || photoUploading}
              />

              <TouchableOpacity
                style={s.notOkayBtn}
                onPress={() => setLocalCrisis(true)}
                accessibilityLabel="I'm not okay — get support resources"
                accessibilityRole="button"
              >
                <Text variant="muted" style={{ textDecorationLine: 'underline' }}>
                  I'm not okay
                </Text>
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
