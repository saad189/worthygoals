import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Example Chat Data
type Chat = {
  id: string;
  name: string;
  avatar: any;           // Typically string (URL) or require(...) for local
  lastMessage: string;
  time: string;
  isRead: boolean;
};

const CHAT_DATA: Chat[] = [
  {
    id: '1',
    name: 'McGregor',
    avatar: require('@/assets/images/icon.png'),
    lastMessage: 'Getup Champ! This is the moment to takeover, No Rest...',
    time: '5:30 AM',
    isRead: false,
  },
  {
    id: '2',
    name: 'Dr. Peterson',
    avatar: require('@/assets/images/icon.png'),
    lastMessage: '“Become One” says Dostoyevsky, because he knows...',
    time: '8:30 AM',
    isRead: true,
  },
  {
    id: '3',
    name: 'Scarlett',
    avatar: require('@/assets/images/icon.png'),
    lastMessage: 'Hey! How are you. Today is such a Beautiful Day...',
    time: '11:30 PM',
    isRead: true,
  },
];

// Individual Chat Item
const ChatListItem = ({ chat }: { chat: Chat }) => {
  const { name, avatar, lastMessage, time, isRead } = chat;

  return (
    <TouchableOpacity style={styles.chatItem}>
      <Image source={avatar} style={styles.avatar} />

      <View style={styles.chatTextContainer}>
        <View style={styles.chatRow}>
          <Text style={styles.chatName}>{name}</Text>
          <Text style={styles.chatTime}>{time}</Text>
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
  const renderItem = ({ item }: { item: Chat }) => <ChatListItem chat={item} />;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          {/* Replace with your actual logo */}
          <Text style={styles.logoText}>e volve</Text>
        </View>
        <Text style={styles.headerTitle}>Chat with Specialists</Text>
      </View>

      {/* FLATLIST of CHATS */}
      <FlatList
        data={CHAT_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />

      {/* BOTTOM TABS (PLACEHOLDER) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people" size={24} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={24} color="#aaa" />
        </TouchableOpacity>
      </View>
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
  logoContainer: {
    // For demonstration
    marginBottom: 8,
    alignItems: 'center',
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
  bottomNav: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopColor: '#333',
    borderTopWidth: 1,
    backgroundColor: '#2f2f2f',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
