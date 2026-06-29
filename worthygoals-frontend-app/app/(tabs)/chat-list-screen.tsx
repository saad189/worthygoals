import React, { useCallback } from "react";
import {
  ActivityIndicator,
  View,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";

import { ConversationListItem } from "@/models";
import { useFocusEffect, useNavigation } from "expo-router";
import conversationsService from "@/services/conversations.service";
import { mapTime } from "@/helpers/TimeMapper";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";
import { ROUTE_NAMES } from "@/constants";
import { Header, Screen, Text } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";

const ChatItem = ({ chat }: { chat: ConversationListItem }) => {
  const { colors } = useAppTheme();
  const { name, avatar, lastMessage, time, isRead, id } = chat;
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const messagePreview = (lastMessage ?? "").trim() || "No messages yet";

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
    <TouchableOpacity
      style={[staticStyles.chatItem, { borderBottomColor: colors.border }]}
      onPress={openChatDetail}
    >
      <Image
        source={{ uri: avatar }}
        style={[staticStyles.avatar, { backgroundColor: colors.canvas }]}
      />

      <View style={staticStyles.chatTextContainer}>
        <View style={staticStyles.chatRow}>
          <Text variant="label">{name}</Text>
          <Text variant="mono">{mapTime(new Date(time))}</Text>
        </View>

        <View style={staticStyles.chatRow}>
          <Text
            variant="muted"
            numberOfLines={1}
            style={[staticStyles.chatMessageSnippet, !isRead && staticStyles.unreadSnippet]}
            color={isRead ? "textFaint" : "text"}
          >
            {messagePreview.length > 50
              ? messagePreview.slice(0, 50) + "..."
              : messagePreview}
          </Text>
          {!isRead && (
            <View style={[staticStyles.unreadDot, { backgroundColor: colors.unreadDot }]} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ChatListScreen() {
  const { colors, space } = useAppTheme();
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
    <Screen padded={false} edges={["top"]}>
      <Header
        title="messages"
        eyebrow="your conversations"
        style={{ paddingHorizontal: space["5"], marginBottom: space["3"] }}
      />

      <FlatList
        data={chatData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={staticStyles.listContent}
        ListEmptyComponent={() => (
          <View style={staticStyles.emptyContainer}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text variant="muted">
                {error
                  ? error
                  : "No conversations yet. Open the Team tab to start a chat."}
              </Text>
            )}
          </View>
        )}
      />
    </Screen>
  );
}

const staticStyles = StyleSheet.create({
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  chatMessageSnippet: {
    flex: 1,
    marginRight: 8,
  },
  unreadSnippet: {
    fontWeight: "bold",
  },
  unreadDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
