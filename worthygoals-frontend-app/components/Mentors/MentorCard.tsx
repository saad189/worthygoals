import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Mentor } from "@/models";

export default function MentorCard({
  mentor,
  onPress,
}: {
  mentor: Mentor;
  onPress: () => void;
}) {
  const avatar = mentor.avatarUrl || mentor.coverImageUrl || "";

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
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
});
