import React, { useCallback } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";

import { ConversationDetail, ConversationListItem } from "@/models";
import { useFocusEffect, useNavigation } from "expo-router";
import conversationsService from "@/services/conversations.service";
import { mapTime } from "@/helpers/TimeMapper";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";
import { ROUTE_NAMES } from "@/constants";
import Background from "@/components/SubComponents/Background";

export default function ChatListWithBackground() {
  return (
    <Background style={styles.container}>
      <ChatListScreen />
    </Background>
  );
}

// Individual Chat Item
const ChatItem = ({ chat }: { chat: ConversationListItem }) => {
  const { name, avatar, lastMessage, time, isRead, id } = chat;
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const openChatDetail = () => {
    conversationsService
      .getConversationShellByConversationId(id)
      .then((data) => {
        navigation.navigate(ROUTE_NAMES.CHAT.self, {
          screen: ROUTE_NAMES.CHAT.CHAT_VIEW_SCREEN,
          params: { chatData: data },
        });
      });
  };

  return (
    <TouchableOpacity style={styles.chatItem} onPress={openChatDetail}>
      <Image source={{ uri: avatar }} style={styles.avatar} />

      <View style={styles.chatTextContainer}>
        <View style={styles.chatRow}>
          <Text style={styles.chatName}>{name}</Text>
          <Text style={styles.chatTime}>{mapTime(new Date(time))}</Text>
        </View>

        <View style={styles.chatRow}>
          {/* Show the snippet in a lighter style, or bold if unread */}
          <Text style={[styles.chatMessageSnippet, !isRead && styles.unread]}>
            {lastMessage.length > 50
              ? lastMessage.slice(0, 50) + "..."
              : lastMessage}
          </Text>
          {/* You could show a read/unread indicator here */}
          {!isRead && <View style={styles.unreadDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

function ChatListScreen() {
  const [chatData, setChatData] = React.useState<ConversationListItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      setLoading(true);

      conversationsService
        .getUserConversationList()
        .then((data: ConversationListItem[]) => {
          if (!isMounted) return;
          const sortedData = data.sort(
            (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
          );
          setChatData(sortedData);
          setError(null);
        })
        .catch((e: any) => {
          if (!isMounted) return;
          setError(e?.message ?? "Failed to load conversations");
          setChatData([]);
        })
        .finally(() => {
          if (!isMounted) return;
          setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }, [])
  );
  const renderItem = ({ item }: { item: ConversationListItem }) => (
    <ChatItem chat={item} />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat with Specialists</Text>
      </View>

      {/* FLATLIST of CHATS */}
      <FlatList
        data={chatData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.emptyText}>
                {error
                  ? error
                  : "No conversations yet. Go to the Mentors tab to start a chat."}
              </Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  logoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyText: {
    color: "#ccc",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: "#333",
    borderBottomWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  chatTextContainer: {
    flex: 1,
  },
  chatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  chatTime: {
    fontSize: 12,
    color: "#aaa",
  },
  chatMessageSnippet: {
    fontSize: 14,
    color: "#ccc",
    flex: 1,
    marginRight: 8,
  },
  unread: {
    fontWeight: "bold",
    color: "#fff",
  },
  unreadDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#00ff00",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },
});
