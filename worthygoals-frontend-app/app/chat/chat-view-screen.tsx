import React, { useEffect, useState } from 'react';
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
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// If you want icons for the back arrow or overflow menu
import { Ionicons } from '@expo/vector-icons';

import { ChatDetail, ChatMessage, MessageType } from '@/models';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase, useRoute } from '@react-navigation/native';
import chatService from '@/services/chats.service';
import Background from '@/components/SubComponents/Background';
import { mapTime } from '@/helpers/TimeMapper';
import { ROUTE_NAMES } from '@/constants';
import Animated from 'react-native-reanimated';
const iconColor = '#FFF';

export default function ChatViewScreenWithBackground() {
    return (
        <Background style={styles.container}>
            <ChatViewScreen />
        </Background>
    )
}

function ChatViewScreen() {
    const { params: { chatData } } = useRoute() as any;
    const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
    const [chatDetail, setChatDetail] = useState<ChatDetail>(chatData);
    const [inputText, setInputText] = useState<string>('');

    const updateChat = () => {
        const updatedMessages = chatDetail.messages.map((message) => ({
            ...message,
            isRead: true,
        }));
        const updatedChatDetail = { ...chatDetail, messages: updatedMessages };
        setChatDetail(updatedChatDetail);
        chatService.saveChat(updatedChatDetail);
    }
    useEffect(() => {
        updateChat();
    }, []);

    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
        const isCurrentUser = item.senderId === 'user';
        const messages = chatDetail.messages;          // Our full message array
        const isLastMessage = index === messages.length - 1;

        // Check if the next message has a different sender
        let shouldAddMargin = !isLastMessage && messages[index + 1].senderId !== item.senderId;

        const isMedia = ['image', 'audio', 'video'].includes(item.type);

        // A special check for "GOALS" text to show as gradient card
        const isGoalsCard =
            item.type === 'text' && item.content.toLowerCase().includes('goals #01');

        if (isGoalsCard) {
            return (
                <View style={[styles.goalsCardContainer, styles.messageLeft]}>
                    <LinearGradient
                        colors={['#FF5F6D', '#FFC371']}
                        style={styles.goalsCardGradient}
                    >
                        <Text style={styles.goalsCardText}>{item.content}</Text>
                        <Text style={[styles.messageTime, styles.mediaTime]}>
                            {mapTime(new Date(item.time))}
                        </Text>
                    </LinearGradient>
                </View>
            );
        }

        return (
            <View
                style={[
                    styles.messageContainer,
                    isCurrentUser ? styles.messageRight : styles.messageLeft,
                    isMedia && styles.mediaStyle,
                    shouldAddMargin && !isMedia && { marginBottom: 10 }, // Add margin if user changed
                ]}
            >
                {/* text, image, or audio/video display */}
                {item.type === 'text' && (
                    <Text style={styles.messageText}>{item.content}</Text>
                )}

                {item.type === 'image' && (
                    <TouchableOpacity onPress={() => {
                        navigation.navigate(ROUTE_NAMES.CHAT.IMAGE_VIEWER, { imageUri: item.content, tag: `${item.id}-tag` })
                    }}
                        style={{ minWidth: 150, minHeight: 150 }}
                    >
                        <Animated.Image
                            source={{ uri: item.content }}
                            resizeMode="cover"
                            sharedTransitionTag={`${item.id}-tag`}
                            style={styles.imageMessage}
                        />
                    </TouchableOpacity>
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
                <Text style={[styles.messageTime, isMedia ? styles.mediaTime : null]}>{mapTime(new Date(item.time))}</Text>
            </View>
        );
    };

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMessage: ChatMessage = {
            id: `m-${Date.now()}`,
            type: 'text',
            content: inputText.trim(),
            time: (new Date()).toString(),
            isRead: false,
            senderId: 'user',
            recepientType: 'mentor'
        };
        chatService.saveMessage(chatDetail.id, newMessage);
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
                    <TouchableOpacity onPress={navigation.goBack} style={{ marginLeft: 5 }}>
                        <Ionicons name="arrow-back" size={24} color={iconColor} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => { navigation.navigate(ROUTE_NAMES.CHAT.CHAT_SETTINGS_SCREEN, { mentorId: chatDetail.mentorId }) }}
                        style={styles.profileImageWrapper}>
                        <Image
                            source={{ uri: chatDetail.avatar }}
                            style={styles.avatar}
                            resizeMode="cover"
                        />
                        <Text style={styles.headerTitle}>{chatDetail.name}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => { /* open overflow menu */ }}>
                        <Ionicons name="ellipsis-vertical" size={20} color={iconColor} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={chatDetail.messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    style={styles.chatList}
                    contentContainerStyle={styles.chatContentContainer}
                />
                <View style={{ marginBottom: 30 }}></View>
                {/* Input bar */}
                <View style={styles.inputContainer}>
                    <ScrollView
                        style={styles.inputScrollView}
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={true}
                    >
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Chat with your Coach..."
                            placeholderTextColor="#999"
                            multiline={true}
                            returnKeyType='default'
                        />
                    </ScrollView>
                    <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                        <Ionicons name="send" size={18} color={iconColor} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>


            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoiding: {
        flex: 1,
    },
    header: {
        height: 100,
        backgroundColor: 'rgba(168, 168, 168, 0.33)',
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 15,
        paddingBottom: 20,
        justifyContent: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginHorizontal: 8,
        marginVertical: -6
    },
    headerTitle: {
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
        justifyContent: 'flex-end',
        flexGrow: 1,
    },
    messageContainer: {
        maxWidth: '80%',
        marginVertical: 4,
        margin: 10,
        padding: 8,
        paddingLeft: 12,
        paddingRight: 20,
        borderRadius: 8,
    },
    messageLeft: {
        alignSelf: 'flex-start',
        backgroundColor: '#F9F9F9',
    },
    messageRight: {
        alignSelf: 'flex-end',
        backgroundColor: '#F0F34E',
    },
    messageText: {
        color: 'black',
        fontSize: 14,
        marginBottom: 4,
    },
    messageTime: {
        fontSize: 12,
        alignSelf: 'flex-end',
        position: 'relative',
        paddingTop: 4,
        right: -12,
        color: `#9D9D9D`
    },
    mediaTime: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        color: `#9D9D9D`
    },
    imageMessage: {
        width: 250,
        height: 250,
        borderRadius: 8,
    },
    mediaStyle: {
        marginVertical: 30,
        padding: 2,
        margin: 10,
        paddingLeft: 2,
        paddingRight: 2,

    },
    profileImageWrapper: {
        paddingHorizontal: 10,
        flex: 1,
        flexDirection: 'row'
    },
    // Goals card styling
    goalsCardContainer: {
        maxWidth: '80%',
        marginVertical: 4,
        margin: 10,
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
        marginLeft: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
        paddingBottom: 20
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 3,
        fontSize: 15,
        backgroundColor: '#2E2E2E',
        color: '#FFF',
        borderRadius: 20,
        marginRight: 8,
    },
    inputScrollView: {
        flex: 1,
        maxHeight: 100, // Adjust based on 5 lines and font size
        backgroundColor: '#2E2E2E',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
    },
    sendButton: {
        backgroundColor: 'purple',
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-end'
    },
});
