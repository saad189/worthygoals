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
  const avatar = mentor.avatarUrl || mentor.coverImageUrl || "";

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.mainPressArea} onPress={onPress}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={styles.textContainer}>
          <Text style={styles.name}>{mentor.name}</Text>
          {!!mentor.title && <Text style={styles.title}>{mentor.title}</Text>}
          {!!mentor.shortDescription && (
            <Text style={styles.description} numberOfLines={2}>
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
          style={styles.chatButton}
        >
          {chatLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color="#fff"
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: "#333",
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
    backgroundColor: "#222",
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  title: {
    fontSize: 13,
    color: "#ddd",
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: "#aaa",
    marginTop: 4,
  },
  chatButton: {
    paddingLeft: 12,
    paddingVertical: 8,
  },
});
