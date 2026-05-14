import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Mentor } from "@/models";
import { useAppTheme } from "@/hooks/useAppTheme";

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
  const { colors } = useAppTheme();
  const avatar = mentor.avatarUrl || mentor.coverImageUrl || "";

  return (
    <View style={[staticStyles.container, { borderBottomColor: colors.border }]}>
      <TouchableOpacity style={staticStyles.mainPressArea} onPress={onPress}>
        <Image
          source={{ uri: avatar }}
          style={[staticStyles.avatar, { backgroundColor: colors.surface }]}
        />
        <View style={staticStyles.textContainer}>
          <Text style={[staticStyles.name, { color: colors.textWhite }]}>{mentor.name}</Text>
          {!!mentor.title && (
            <Text style={[staticStyles.title, { color: colors.textFaint }]}>{mentor.title}</Text>
          )}
          {!!mentor.shortDescription && (
            <Text style={[staticStyles.description, { color: colors.textMuted }]} numberOfLines={2}>
              {mentor.shortDescription}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {!!onChatPress && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onChatPress}
          disabled={!!chatLoading}
          style={staticStyles.chatButton}
        >
          {chatLoading ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : (
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textWhite} />
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
    borderBottomWidth: 1,
  },
  mainPressArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  title: {
    fontSize: 13,
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    marginTop: 4,
  },
  chatButton: {
    paddingLeft: 12,
    paddingVertical: 8,
  },
});
