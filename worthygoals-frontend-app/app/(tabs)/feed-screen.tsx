/**
 * feed tab · the polyphonic feed (Hi-Fi flow ⑤ · screen 13).
 *
 * The user broadcasts a one-line status to the team; each mentor replies in
 * their own voice, type, colour and bubble shape. Tap "+ status" to compose
 * (screen 12). Replaces the U2 placeholder that re-exported the inspiration
 * board — status is the feed tab per the Hi-Fi IA (TabBar active={3}).
 * Tapping a reply talks back 1:1 — it opens that mentor's chat (S47).
 */
import React, { useState } from 'react';
import { Alert, Image, RefreshControl, StyleSheet, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

import { Button, Header, Screen, Text } from '@/components/ui';
import StatusReactionCard from '@/components/StatusReactionCard';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useMentors } from '@/hooks/useMentors';
import { useStatusFeed } from '@/hooks/useStatusFeed';
import conversationsService from '@/services/conversations.service';
import { formatErrorMessage } from '@/helpers/ErrorFormatter';
import { ROUTE_NAMES } from '@/constants/Routes';
import { Mentor, StatusPost, StatusReaction } from '@/models';

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
  const { mentors } = useMentors();
  const [openingChat, setOpeningChat] = useState(false);

  const compose = () =>
    navigation.navigate(ROUTE_NAMES.STATUS.self as any, {
      screen: ROUTE_NAMES.STATUS.COMPOSE_SCREEN,
    });

  // "tap a reply to talk back · 1:1" (screen 13) — resolve the reaction's
  // personality slug to the roster mentor (slug === personalityId on the WG
  // roster) and drop into that mentor's chat, same path as mentor-detail.
  const talkBack = async (reaction: StatusReaction) => {
    if (openingChat) return;
    const mentor = mentors.find((m: Mentor) => m.slug === reaction.personalityId);
    if (!mentor) return;
    try {
      setOpeningChat(true);
      const chatData = await conversationsService.getConversationShellByMentorId(mentor.id);
      navigation.navigate(ROUTE_NAMES.CHAT.self as any, {
        screen: ROUTE_NAMES.CHAT.CHAT_VIEW_SCREEN,
        params: { chatData },
      });
    } catch (e: any) {
      Alert.alert("Couldn't open the chat", formatErrorMessage(e));
    } finally {
      setOpeningChat(false);
    }
  };

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
                {post.imageUrl ? (
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={{
                      marginTop: space['3'],
                      width: '100%',
                      aspectRatio: 4 / 3,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    accessibilityLabel="Photo attached to this status"
                  />
                ) : null}
              </View>

              <Text variant="eyebrow">
                {post.reactions.length} {post.reactions.length === 1 ? 'reply' : 'replies'}
              </Text>

              {post.reactions.map((r) => (
                <StatusReactionCard
                  key={`${post.id}-${r.personalityId}`}
                  reaction={r}
                  onPress={talkBack}
                />
              ))}

              {post.reactions.length > 0 && (
                <Text variant="muted" style={styles.talkBackHint}>
                  tap a reply to talk back · 1:1
                </Text>
              )}
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
  talkBackHint: { textAlign: 'center', fontStyle: 'italic' },
});
