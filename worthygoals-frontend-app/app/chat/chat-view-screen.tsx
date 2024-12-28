import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// If you want icons for the back arrow or overflow menu
import { Ionicons } from '@expo/vector-icons';

import { ChatDetail, ChatMessage, MessageType } from '@/models';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';

const SAMPLE_CHAT_DETAIL: ChatDetail = {
    id: '1',
    name: 'McGregor',
    avatar: 'https://example.com/mcgregor-avatar.jpg', // sample
    messages: [
        {
            id: 'm1',
            type: 'text',
            content: 'Getup Champ! This is the moment to takeover, No Rest, No Slacking, Champ...',
            time: '5:30 AM',
            isRead: true,
            senderId: 'coach',
        },
        {
            id: 'm2',
            type: 'text',
            content: 'Come On Man! Embrace the Suck.',
            time: '5:35 AM',
            isRead: true,
            senderId: 'coach',
        },
        {
            id: 'm3',
            type: 'image',
            content: 'https://mmajunkie.usatoday.com/wp-content/uploads/sites/91/2017/01/conor-mcgregor-ufc-205.jpg?w=1000&h=600&crop=1', // URL to an image
            time: '5:42 AM',
            isRead: true,
            senderId: 'coach',
        },
        {
            id: 'm4',
            type: 'text',
            content: 'Alright! I’m Up, Give me a Minute.',
            time: '5:45 AM',
            isRead: true,
            senderId: 'user',
        },
        {
            id: 'm5',
            type: 'text',
            content: 'That’s it! My Man.... Lets Fu@#ing Go!',
            time: '5:45 AM',
            isRead: true,
            senderId: 'coach',
        },
        {
            id: 'm6',
            type: 'text',
            content:
                'GOALS #01: Want to Go for an Early Morning Run Every Day of the Week, Starting Now. I want to be Active in the Mornings!',
            time: '5:46 AM',
            isRead: true,
            senderId: 'coach',
        },
    ],
};

export default function ChatViewScreen() {
    // const { params: { id } } = useRoute() as any;
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    const [chatDetail, setChatDetail] = useState<ChatDetail>(SAMPLE_CHAT_DETAIL);
    const [inputText, setInputText] = useState<string>('');

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isCurrentUser = item.senderId === 'user';

        // A special check for "GOALS" text to show as gradient card (just as an example):
        const isGoalsCard =
            item.type === 'text' && item.content.toLowerCase().includes('goals #01');

        if (isGoalsCard) {
            // Return a gradient “card” for the Goals message
            return (
                <View style={[styles.goalsCardContainer, styles.messageLeft]}>
                    <LinearGradient
                        colors={['#FF5F6D', '#FFC371']}
                        // or maybe: ['#6A82FB', '#FC5C7D'] for a different combo
                        style={styles.goalsCardGradient}
                    >
                        <Text style={styles.goalsCardText}>{item.content}</Text>
                        <Text style={styles.messageTime}>{item.time}</Text>
                    </LinearGradient>
                </View>
            );
        }

        return (
            <View
                style={[
                    styles.messageContainer,
                    isCurrentUser ? styles.messageRight : styles.messageLeft,
                ]}
            >
                {/* Different message bubble styles based on type */}
                {item.type === 'text' && (
                    <Text style={styles.messageText}>{item.content}</Text>
                )}

                {item.type === 'image' && (
                    <Image
                        source={{ uri: item.content }}
                        style={styles.imageMessage}
                        resizeMode="cover"
                    />
                )}

                {(item.type === 'audio' || item.type === 'video') && (
                    <Text style={styles.messageText}>
                        {item.type.toUpperCase()} message: {item.content}
                    </Text>
                    /*
        In a real app, you might use:
          - <Video source={{ uri: item.content }} ... />
          - or an Audio player library for `audio`
      */
                )}

                <Text style={styles.messageTime}>{item.time}</Text>
            </View>
        );
    };

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMessage: ChatMessage = {
            id: `m-${Date.now()}`,
            type: 'text',
            content: inputText.trim(),
            time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            }),
            isRead: false,
            senderId: 'user',
        };

        setChatDetail((prev) => ({
            ...prev,
            messages: [...prev.messages, newMessage],
        }));
        setInputText('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoiding}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
                {/* Header row */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { navigation.goBack(); console.log('PRESSED') }}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <Image
                        source={{ uri: chatDetail.avatar }}
                        style={styles.avatar}
                        resizeMode="cover"
                    />
                    <Text style={styles.headerTitle}>{chatDetail.name}</Text>

                    <TouchableOpacity onPress={() => { /* open overflow menu */ }}>
                        <Ionicons name="ellipsis-vertical" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={chatDetail.messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    style={styles.chatList}
                    contentContainerStyle={styles.chatContentContainer}
                />

                {/* Input bar */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Chat with your Coach..."
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                        <Ionicons name="send" size={18} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212', // Dark background
    },
    keyboardAvoiding: {
        flex: 1,
    },
    header: {
        height: 90,
        backgroundColor: '#1F1F1F',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 10,
        justifyContent: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginHorizontal: 8,
    },
    headerTitle: {
        flex: 1,
        color: '#FFF',
        fontSize: 17,
        fontWeight: '600',
    },
    chatList: {
        flex: 1,
    },
    chatContentContainer: {
        paddingHorizontal: 8,
        paddingVertical: 10,
        paddingBottom: 60, // allow space for input bar
    },
    messageContainer: {
        maxWidth: '75%',
        marginVertical: 4,
        padding: 10,
        borderRadius: 8,
    },
    messageLeft: {
        alignSelf: 'flex-start',
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: 0,
    },
    messageRight: {
        alignSelf: 'flex-end',
        backgroundColor: '#333333',
        borderTopRightRadius: 0,
    },
    messageText: {
        color: '#FFF',
        fontSize: 15,
        marginBottom: 4,
    },
    messageTime: {
        fontSize: 12,
        color: '#999',
        alignSelf: 'flex-end',
    },
    imageMessage: {
        width: 200,
        height: 200,
        borderRadius: 8,
        marginBottom: 4,
    },
    // Goals card styling
    goalsCardContainer: {
        maxWidth: '75%',
        marginVertical: 4,
        borderRadius: 8,
        overflow: 'hidden', // so gradient corners are clipped
    },
    goalsCardGradient: {
        padding: 12,
    },
    goalsCardText: {
        color: '#FFF',
        fontSize: 15,
        marginBottom: 4,
    },
    // Input bar
    inputContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1F1F1F',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 15,
        backgroundColor: '#2E2E2E',
        color: '#FFF',
        borderRadius: 20,
        marginRight: 8,
    },
    sendButton: {
        backgroundColor: 'purple',
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
