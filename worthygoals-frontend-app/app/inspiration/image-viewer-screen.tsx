import React, { useCallback } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { BoardItem } from '@/models';

const { width, height } = Dimensions.get('window');

const MOOD_EMOJI: Record<number, string> = { 1: '😣', 2: '😐', 3: '🙂', 4: '🔥' };

const CardDetailModal = () => {
  const { colors, space, radius } = useAppTheme();
  const { params } = useRoute() as { params: { item: BoardItem } };
  const navigation = useNavigation();
  const { item } = params;

  const close = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <View style={styles.root}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <Pressable style={StyleSheet.absoluteFill} onPress={close} />

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
          },
        ]}
      >
        {item.mediaUrl ? (
          <Image
            source={{ uri: item.mediaUrl }}
            style={[styles.photo, { borderRadius: radius.md }]}
            contentFit="cover"
            transition={200}
          />
        ) : null}

        <ScrollView
          contentContainerStyle={[styles.body, { padding: space['4'] }]}
          showsVerticalScrollIndicator={false}
        >
          {item.type === 'milestone' ? (
            <>
              <Text style={styles.milestoneEmoji}>
                {item.milestoneKind === 'goal_completed'
                  ? '🏆'
                  : item.milestoneKind === 'streak_30'
                  ? '⚡'
                  : '🔥'}
              </Text>
              <Text style={[styles.title, { color: colors.text }]}>
                {item.goalTitle}
              </Text>
              {item.streakDays !== undefined && (
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {item.streakDays}-day streak reached
                </Text>
              )}
            </>
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.moodEmoji}>
                  {MOOD_EMOJI[item.moodScore ?? 3]}
                </Text>
                {item.goalTitle ? (
                  <Text
                    style={[styles.goalLabel, { color: colors.primary }]}
                    numberOfLines={1}
                  >
                    {item.goalTitle}
                  </Text>
                ) : null}
              </View>

              {item.taskTitle ? (
                <Text style={[styles.taskTitle, { color: colors.text }]}>
                  {item.taskTitle}
                </Text>
              ) : null}

              {item.reflection ? (
                <Text style={[styles.reflection, { color: colors.text }]}>
                  {item.reflection}
                </Text>
              ) : null}

              {item.mentorReaction ? (
                <View
                  style={[
                    styles.reactionBlock,
                    { backgroundColor: colors.canvas, borderRadius: radius.md },
                  ]}
                >
                  <Text style={[styles.reactionLabel, { color: colors.textMuted }]}>
                    Mentor reaction
                  </Text>
                  <Text style={[styles.reactionText, { color: colors.text }]}>
                    {item.mentorReaction}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>

        <Pressable
          onPress={close}
          style={[styles.closeBtn, { backgroundColor: colors.canvas }]}
        >
          <Text style={[styles.closeLabel, { color: colors.textMuted }]}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
};

const SHEET_WIDTH = width * 0.9;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    width: SHEET_WIDTH,
    maxHeight: height * 0.8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 220,
  },
  body: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  moodEmoji: {
    fontSize: 24,
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  reflection: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reactionBlock: {
    padding: 12,
    marginTop: 4,
  },
  reactionLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  reactionText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  milestoneEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  closeBtn: {
    margin: 12,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  closeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CardDetailModal;
