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

import { ConversationListItem } from "@/models";
import { useFocusEffect, useNavigation } from "expo-router";
import conversationsService from "@/services/conversations.service";
import { mapTime } from "@/helpers/TimeMapper";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";
import { ROUTE_NAMES } from "@/constants";
import Background from "@/components/SubComponents/Background";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function ChatListWithBackground() {
  return (
    <Background style={staticStyles.container}>
      <ChatListScreen />
    </Background>
  );
}

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
      <Image source={{ uri: avatar }} style={staticStyles.avatar} />

      <View style={staticStyles.chatTextContainer}>
        <View style={staticStyles.chatRow}>
          <Text style={[staticStyles.chatName, { color: colors.textWhite }]}>{name}</Text>
          <Text style={[staticStyles.chatTime, { color: colors.textMuted }]}>
            {mapTime(new Date(time))}
          </Text>
        </View>

        <View style={staticStyles.chatRow}>
          <Text
            style={[
              staticStyles.chatMessageSnippet,
              { color: colors.textFaint },
              !isRead && { fontWeight: "bold", color: colors.textWhite },
            ]}
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

function ChatListScreen() {
  const { colors } = useAppTheme();
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
    <SafeAreaView style={staticStyles.container}>
      <View style={[staticStyles.header, { borderBottomColor: colors.border }]}>
        <Text style={[staticStyles.headerTitle, { color: colors.textWhite }]}>
          Chat with Specialists
        </Text>
      </View>

      <FlatList
        data={chatData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={staticStyles.listContent}
        ListEmptyComponent={() => (
          <View style={staticStyles.emptyContainer}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.textWhite} />
            ) : (
              <Text style={[staticStyles.emptyText, { color: colors.textFaint }]}>
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

const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
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
  emptyText: {},
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  chatTime: {
    fontSize: 12,
  },
  chatMessageSnippet: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
