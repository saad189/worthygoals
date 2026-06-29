import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Mentor } from "@/models";
import { useAppTheme } from "@/hooks/useAppTheme";
import { MentorAvatar, Text } from "@/components/ui";

export default function MentorCard({
  mentor,
  onPress,
  onChatPress,
  chatLoading,
}: {
  mentor: Mentor;
  onPress: () => void;
  onChatPress?: () => void;
  chatLoading?: boolean;
}) {
  const { colors, space } = useAppTheme();

  return (
    <View style={[staticStyles.container, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={staticStyles.mainPressArea}
        onPress={onPress}
        accessibilityRole="button"
      >
        {/* U2 handoff: avatarUrl is null after the roster reseed — identity now
            comes from the per-personality MentorAvatar keyed by slug. */}
        <MentorAvatar
          mentor={mentor.slug}
          size={54}
          style={{ marginRight: space["3"] }}
        />
        <View style={staticStyles.textContainer}>
          <Text variant="title">{mentor.name}</Text>
          {!!mentor.title && (
            <Text variant="eyebrow" style={{ marginTop: space["1"] }}>
              {mentor.title}
            </Text>
          )}
          {!!mentor.shortDescription && (
            <Text variant="muted" numberOfLines={2} style={{ marginTop: space["1"] }}>
              {mentor.shortDescription}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {!!onChatPress && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Chat with ${mentor.name}`}
          onPress={onChatPress}
          disabled={!!chatLoading}
          style={staticStyles.chatButton}
        >
          {chatLoading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color={colors.text}
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const staticStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mainPressArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  chatButton: {
    paddingLeft: 12,
    paddingVertical: 8,
  },
});
