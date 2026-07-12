import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Skeleton from '@/components/Common/Skeleton';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import { Header, Screen, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import useBoard from '@/hooks/useBoard';
import { BoardItem, MilestoneKind } from '@/models';
import { ROUTE_NAMES } from '@/constants';
import { MotiView } from 'moti';

const MOOD_EMOJI: Record<number, string> = { 1: '😣', 2: '😐', 3: '🙂', 4: '🔥' };
const MILESTONE_EMOJI: Record<MilestoneKind, string> = {
  streak_7: '🔥',
  streak_30: '⚡',
  goal_completed: '🏆',
};
const MILESTONE_LABEL: Record<MilestoneKind, string> = {
  streak_7: '7-day streak',
  streak_30: '30-day streak',
  goal_completed: 'Goal complete',
};

const MotivationalBoardScreen: React.FC = () => {
  const { colors, space, radius } = useAppTheme();
  const { items, loading, refreshing, error, refresh } = useBoard();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const renderItem = useCallback(
    ({ item }: { item: BoardItem }) => {
      // E-5: discipline category colours retired — every win/milestone reads in
      // the single warm brand accent (rust), consistent with the Hi-Fi feed.
      const accent = colors.primary;

      if (item.type === 'milestone') {
        const kind = item.milestoneKind ?? 'streak_7';
        return (
          <MotiView
            from={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300 }}
            style={[
              styles.card,
              styles.milestoneCard,
              {
                backgroundColor: colors.surface,
                borderColor: accent,
                borderRadius: radius.md,
                margin: space['1'],
              },
            ]}
            accessibilityLabel={`${MILESTONE_LABEL[kind]} milestone for ${item.goalTitle}`}
          >
            <Text style={styles.milestoneEmoji}>{MILESTONE_EMOJI[kind]}</Text>
            <Text variant="eyebrow" style={[styles.milestoneLabel, { color: accent }]}>
              {MILESTONE_LABEL[kind]}
            </Text>
            <Text style={[styles.milestoneGoal, { color: colors.text }]} numberOfLines={2}>
              {item.goalTitle}
            </Text>
            {item.streakDays !== undefined && (
              <Text style={[styles.streakCount, { color: colors.textMuted }]}>
                {item.streakDays} days
              </Text>
            )}
          </MotiView>
        );
      }

      const hasPhoto = !!item.mediaUrl;
      const cardHeight = hasPhoto ? 200 : 140;

      return (
        <MotiView
          from={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 300 }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate(ROUTE_NAMES.TABS.INSPIRATION.IMAGE_VIEWER, {
                item,
              })
            }
            accessibilityLabel={`Win card: ${item.goalTitle ?? 'task'}, mood ${MOOD_EMOJI[item.moodScore ?? 3]}`}
            accessibilityRole="button"
            style={[
              styles.card,
              {
                height: cardHeight,
                borderRadius: radius.md,
                margin: space['1'],
                overflow: 'hidden',
              },
            ]}
          >
            {hasPhoto ? (
              <Image
                source={{ uri: item.mediaUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: colors.canvas },
                ]}
              />
            )}
            <View
              style={[styles.cardOverlay, { backgroundColor: colors.overlayBlack }]}
            >
              <Text style={styles.moodEmoji}>
                {MOOD_EMOJI[item.moodScore ?? 3]}
              </Text>
              {item.goalTitle ? (
                <Text
                  variant="eyebrow"
                  style={[styles.goalName, { color: accent }]}
                  numberOfLines={1}
                >
                  {item.goalTitle}
                </Text>
              ) : null}
              {item.reflection ? (
                <Text
                  style={[styles.reflection, { color: colors.textWhite }]}
                  numberOfLines={2}
                >
                  {item.reflection}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        </MotiView>
      );
    },
    [colors, space, radius, navigation],
  );

  if (loading) {
    return (
      <Screen padded={false} edges={['top']} style={styles.container}>
        <View style={styles.titleContainer}>
          <Header title="feed" eyebrow="your wins" />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 12, paddingTop: 12 }}>
          <View style={{ flex: 1, gap: 12 }}>
            <Skeleton height={180} radius={12} />
            <Skeleton height={120} radius={12} />
          </View>
          <View style={{ flex: 1, gap: 12, paddingTop: 40 }}>
            <Skeleton height={120} radius={12} />
            <Skeleton height={160} radius={12} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false} edges={['top']} style={styles.container}>
      <View style={styles.titleContainer}>
        <Header title="feed" eyebrow="your wins" />
      </View>

      {error ? (
        <Text variant="muted" style={styles.errorText}>
          {error}
        </Text>
      ) : null}

      {items.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text variant="display" style={styles.emptyTitle}>
            nothing here yet.
          </Text>
          <Text variant="muted" style={styles.emptyBody}>
            Finish tasks in a good mood and your wins start collecting here.
          </Text>
        </View>
      ) : (
        <FlashList
          masonry
          data={items}
          numColumns={2}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
        />
      )}
    </Screen>
  );
};

export default MotivationalBoardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 4,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  loader: {
    marginTop: 60,
  },
  listContent: {
    paddingBottom: 40,
    paddingHorizontal: 4,
  },
  card: {
    minHeight: 120,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  moodEmoji: {
    fontSize: 18,
  },
  goalName: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reflection: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  milestoneCard: {
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  milestoneEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  milestoneLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  milestoneGoal: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  streakCount: {
    fontSize: 11,
    marginTop: 4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
