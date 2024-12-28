import React, { useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';

import { ChatListItem } from '@/models';
import { useFocusEffect, useNavigation } from 'expo-router';
import chatService from '@/services/chats.service';
import { mapTime } from '@/helpers/TimeMapper';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import { ROUTE_NAMES } from '@/constants';


// Individual Chat Item
const ChatItem = ({ chat }: { chat: ChatListItem }) => {
  const { name, avatar, lastMessage, time, isRead, id } = chat;
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  return (
    <TouchableOpacity style={styles.chatItem} onPress={() =>
      navigation.navigate(ROUTE_NAMES.CHAT.self, { screen: ROUTE_NAMES.CHAT.CHAT_VIEW_SCREEN, params: { id } })}>
      <Image source={avatar as any} style={styles.avatar} />

      <View style={styles.chatTextContainer}>
        <View style={styles.chatRow}>
          <Text style={styles.chatName}>{name}</Text>
          <Text style={styles.chatTime}>{mapTime(new Date(time))}</Text>
        </View>

        <View style={styles.chatRow}>
          {/* Show the snippet in a lighter style, or bold if unread */}
          <Text style={[styles.chatMessageSnippet, !isRead && styles.unread]}>
            {lastMessage}
          </Text>
          {/* You could show a read/unread indicator here */}
          {!isRead && <View style={styles.unreadDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ChatListScreen() {
  const [chatData, setChatData] = React.useState<ChatListItem[]>([]);


  useFocusEffect(
    useCallback(() => {
      chatService.getUserChatList().then((data: ChatListItem[]) => {
        const sortedData = data.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setChatData(sortedData);
      })
    }, [])
  );
  const renderItem = ({ item }: { item: ChatListItem }) => <ChatItem chat={item} />;

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
      />

    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c', // or your preferred background
  },
  header: {
    padding: 16,
    backgroundColor: '#2f2f2f', // Something slightly lighter/darker
    borderBottomColor: '#444',
    borderBottomWidth: 1,
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#333',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  chatTime: {
    fontSize: 12,
    color: '#aaa',
  },
  chatMessageSnippet: {
    fontSize: 14,
    color: '#ccc',
    flex: 1,
    marginRight: 8,
  },
  unread: {
    fontWeight: 'bold',
    color: '#fff',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff00',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
