/**
 * feed tab · the polyphonic feed (Hi-Fi flow ⑤ · screen 13).
 *
 * The user broadcasts a one-line status to the team; each mentor replies in
 * their own voice, type, colour and bubble shape. Tap "+ status" to compose
 * (screen 12). Replaces the U2 placeholder that re-exported the inspiration
 * board — status is the feed tab per the Hi-Fi IA (TabBar active={3}).
 */
import React from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

import { Button, Header, Screen, Text } from '@/components/ui';
import StatusReactionCard from '@/components/StatusReactionCard';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useStatusFeed } from '@/hooks/useStatusFeed';
import { ROUTE_NAMES } from '@/constants/Routes';
import { StatusPost } from '@/models';

/** "11:14 AM" — keeps the post header close to the design's timestamp. */
function postTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d
    .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    .toUpperCase();
}

export default function FeedScreen() {
  const { colors, space, radius } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const { posts, loading, error, refetch, refreshing } = useStatusFeed();

  const compose = () =>
    navigation.navigate(ROUTE_NAMES.STATUS.self as any, {
      screen: ROUTE_NAMES.STATUS.COMPOSE_SCREEN,
    });

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={colors.textMuted} />
      }
    >
      <View style={styles.headerRow}>
        <Header eyebrow="FEED" title="the team." style={styles.noMargin} />
        <Button label="+ status" onPress={compose} block={false} />
      </View>

      {loading && posts.length === 0 ? (
        <Text variant="muted" style={{ marginTop: space['8'] }}>
          Loading the feed…
        </Text>
      ) : error ? (
        <Text variant="muted" color="primary" style={{ marginTop: space['8'] }}>
          {error}
        </Text>
      ) : posts.length === 0 ? (
        <View style={{ marginTop: space['8'], gap: space['4'] }}>
          <Text variant="display" style={{ fontSize: 26 }}>
            Tell the team something.
          </Text>
          <Text variant="muted">
            Post a win, a miss, or both — Marcus, Lyra and Goggs each react in their own voice.
          </Text>
          <Button label="+ status" onPress={compose} />
        </View>
      ) : (
        <View style={{ gap: space['8'], marginTop: space['2'], paddingBottom: space['8'] }}>
          {posts.map((post: StatusPost) => (
            <View key={post.id} style={{ gap: space['4'] }}>
              {/* The post */}
              <View
                style={{
                  padding: space['4'],
                  borderRadius: radius.lg,
                  backgroundColor: colors.canvas,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text variant="eyebrow">YOU · {postTime(post.createdAt)}</Text>
                <Text variant="body" style={{ marginTop: space['2'], fontStyle: 'italic' }}>
                  “{post.text}”
                </Text>
              </View>

              <Text variant="eyebrow">
                {post.reactions.length} {post.reactions.length === 1 ? 'reply' : 'replies'}
              </Text>

              {post.reactions.map((r) => (
                <StatusReactionCard key={`${post.id}-${r.personalityId}`} reaction={r} />
              ))}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  noMargin: { marginBottom: 0, flex: 1 },
});
