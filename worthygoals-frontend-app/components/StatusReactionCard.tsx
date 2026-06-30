/**
 * Worthy Goals — StatusReactionCard (Hi-Fi flow ⑤, screen 13)
 * ─────────────────────────────────────────────────────────────
 * One mentor's in-voice reply to a status, rendered in THEIR identity:
 *   Marcus — square avatar · sans · ink · accent left-bar
 *   Lyra   — round avatar  · serif italic · slate-blue
 *   Goggs  — block avatar  · mono UPPERCASE · rust fill, sharp corners
 * This per-mentor type/colour/shape is the whole point of the polyphonic feed.
 * Tap to talk back 1:1 (opens the mentor's chat).
 */
import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Text, MentorAvatar } from '@/components/ui';
import { StatusReaction } from '@/models';

type Props = {
  reaction: StatusReaction;
  onPress?: (reaction: StatusReaction) => void;
};

export default function StatusReactionCard({ reaction, onPress }: Props) {
  const slug = reaction.personalityId;
  const { colors, accent, bubbleRadius, fonts, space, radius } =
    useAppTheme(slug);

  const isGoggs = slug === 'goggs';
  const isLyra = slug === 'lyra';

  // Goggs reacts on a full rust fill; Marcus/Lyra on warm paper with a tinted edge.
  const bubble: ViewStyle = isGoggs
    ? { backgroundColor: accent, borderColor: accent }
    : {
        backgroundColor: colors.surface,
        borderColor: isLyra ? accent : colors.border,
        borderLeftWidth: 3,
        borderLeftColor: accent,
      };

  const bodyStyle = isGoggs
    ? { color: colors.white, fontFamily: fonts.mono, letterSpacing: 0.3 }
    : isLyra
      ? { color: accent, fontFamily: fonts.serifItalic, fontStyle: 'italic' as const }
      : { color: colors.text };

  return (
    <Pressable
      onPress={onPress ? () => onPress(reaction) : undefined}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${reaction.mentorName}: ${reaction.text}`}
      style={{ flexDirection: 'row', gap: space['3'], alignItems: 'flex-start' }}
    >
      <MentorAvatar mentor={slug} size={32} />
      <View
        style={[
          {
            flex: 1,
            padding: space['4'],
            borderRadius: bubbleRadius,
            borderTopLeftRadius: radius.xs,
            borderWidth: 1,
          },
          bubble,
        ]}
      >
        <Text
          variant="eyebrow"
          style={isGoggs ? { color: colors.white } : { color: accent }}
        >
          {reaction.mentorName}
        </Text>
        <Text variant={isGoggs ? 'mono' : 'body'} style={[{ marginTop: space['2'] }, bodyStyle]}>
          {reaction.text}
        </Text>
      </View>
    </Pressable>
  );
}
