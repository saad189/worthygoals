import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { MasonryFlashList } from '@shopify/flash-list';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import Background from '@/components/SubComponents/Background';
import Header from '@/components/SubComponents/Header';
import { useAppTheme } from '@/hooks/useAppTheme';
import useBoard from '@/hooks/useBoard';
import { BoardItem, MilestoneKind } from '@/models';
import { ROUTE_NAMES } from '@/constants';

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

function categoryColor(
  category: string | undefined,
  colors: ReturnType<typeof useAppTheme>['colors'],
): string {
  switch (category) {
    case 'power':
      return colors.goalCategoryPink;
    case 'knowledge':
      return colors.goalCategoryBlue;
    case 'spiritual':
      return colors.goalCategoryPurple;
    default:
      return colors.primary;
  }
}

const MotivationalBoardScreen: React.FC = () => {
  const { colors, space, radius } = useAppTheme();
  const { items, loading, refreshing, error, refresh } = useBoard();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const renderItem = useCallback(
    ({ item }: { item: BoardItem }) => {
      const accent = categoryColor(item.goalCategory, colors);

      if (item.type === 'milestone') {
        const kind = item.milestoneKind ?? 'streak_7';
        return (
          <View
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
          >
            <Text style={styles.milestoneEmoji}>{MILESTONE_EMOJI[kind]}</Text>
            <Text style={[styles.milestoneLabel, { color: accent }]}>
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
          </View>
        );
      }

      const hasPhoto = !!item.mediaUrl;
      const cardHeight = hasPhoto ? 200 : 140;

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate(ROUTE_NAMES.TABS.INSPIRATION.IMAGE_VIEWER, {
              item,
            })
          }
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
      );
    },
    [colors, space, radius, navigation],
  );

  if (loading) {
    return (
      <Background style={styles.container}>
        <View style={styles.titleContainer}>
          <Header>Motivational Board</Header>
        </View>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </Background>
    );
  }

  return (
    <Background style={styles.container}>
      <View style={styles.titleContainer}>
        <Header>Motivational Board</Header>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.textMuted }]}>{error}</Text>
      ) : null}

      {items.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyEmoji]}>🌱</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Your board is empty
          </Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
            Complete tasks with a happy mood to start building your motivational
            board.
          </Text>
        </View>
      ) : (
        <MasonryFlashList
          data={items}
          numColumns={2}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={160}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
        />
      )}
    </Background>
  );
};

export default MotivationalBoardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 8,
  },
  titleContainer: {
    marginBottom: 12,
    paddingHorizontal: 8,
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});
