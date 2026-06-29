import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { ConversationDetail, ConversationMessage } from "@/models";
import { useNavigation } from "expo-router";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase, useRoute } from "@react-navigation/native";
import { useMessages } from "@/hooks/useMessages";
import { StatusBar } from "expo-status-bar";
import { mapTime } from "@/helpers/TimeMapper";
import { ROUTE_NAMES } from "@/constants";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";
import TypingIndicator from "@/components/Common/TypingIndicator";
import Skeleton from "@/components/Common/Skeleton";

const { height, width } = Dimensions.get("window");

export default function ChatViewScreen() {
  const { colors } = useAppTheme();
  const {
    params: { chatData },
  } = useRoute() as any;

  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const [chatDetail, setChatDetail] = useState<ConversationDetail>(chatData);
  const [inputText, setInputText] = useState<string>("");
  const chatListRef = useRef<FlatList<ConversationMessage>>(null);
  const shouldScrollToBottomRef = useRef(false);

  const { messages: apiMessages, sendText, loading: messagesLoading, isMentorTyping } = useMessages(chatDetail?.id);

  const messages: ConversationMessage[] = (apiMessages ?? []).map((m) => ({
    id: m.id,
    type: "text",
    content: m.text ?? "",
    time: m.createdAt,
    isRead: true,
    senderId: m.role === "user" ? "user" : "coach",
    recepientType: m.role === "user" ? "mentor" : "user",
  }));

  const scrollToBottom = (animated = true) => {
    chatListRef.current?.scrollToEnd({ animated });
  };

  // Keep incoming messages (mentor replies in particular) and the typing
  // indicator in view — onContentSizeChange does the actual scroll.
  const lastMessageId = apiMessages?.length
    ? apiMessages[apiMessages.length - 1].id
    : null;
  useEffect(() => {
    if (lastMessageId) shouldScrollToBottomRef.current = true;
  }, [lastMessageId]);
  useEffect(() => {
    if (isMentorTyping) shouldScrollToBottomRef.current = true;
  }, [isMentorTyping]);

  const updateChat = () => {
    setChatDetail((prev) => prev);
  };
  useEffect(() => {
    updateChat();
  }, []);

  const dynamicStyles = useMemo(() => StyleSheet.create({
    header: {
      height: height * 0.08,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "500",
    },
    messageLeft: {
      alignSelf: "flex-start",
      backgroundColor: colors.bubbleOther,
    },
    messageRight: {
      alignSelf: "flex-end",
      backgroundColor: colors.bubbleSelf,
    },
    messageTextSelf: {
      color: colors.bubbleSelfText,
      fontSize: 14,
      marginBottom: 4,
    },
    messageTextOther: {
      color: colors.bubbleOtherText,
      fontSize: 14,
      marginBottom: 4,
    },
    messageTime: {
      fontSize: 12,
      alignSelf: "flex-end",
      position: "relative",
      paddingTop: 4,
      right: -12,
      color: colors.textMuted,
    },
    mediaTime: {
      position: "absolute",
      bottom: 8,
      right: 8,
      color: colors.textMuted,
    },
    goalsCardText: {
      color: colors.textWhite,
      fontSize: 15,
      marginBottom: 4,
    },
    inputContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      paddingBottom: Platform.OS === "ios" ? height * 0.05 : 20,
    },
    input: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 3,
      fontSize: 15,
      backgroundColor: colors.canvas,
      color: colors.text,
      borderRadius: 20,
      marginRight: 8,
    },
    inputScrollView: {
      flex: 1,
      maxHeight: 100,
      backgroundColor: colors.canvas,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "flex-end",
    },
  }), [colors]);

  const renderMessage = ({
    item,
    index,
  }: {
    item: ConversationMessage;
    index: number;
  }) => {
    const isCurrentUser = item.senderId === "user";
    const isLastMessage = index === messages.length - 1;

    let shouldAddMargin =
      !isLastMessage && messages[index + 1].senderId !== item.senderId;

    const isMedia = ["image", "audio", "video"].includes(item.type);

    const isGoalsCard =
      item.type === "text" && item.content.toLowerCase().includes("goals #01");

    if (isGoalsCard) {
      return (
        <View style={[staticStyles.goalsCardContainer, staticStyles.messageLeft]}>
          <LinearGradient
            colors={[colors.goalsChatGradientStart, colors.goalsChatGradientEnd]}
            style={staticStyles.goalsCardGradient}
          >
            <Text style={dynamicStyles.goalsCardText}>{item.content}</Text>
            <Text style={[dynamicStyles.mediaTime]}>
              {mapTime(new Date(item.time))}
            </Text>
          </LinearGradient>
        </View>
      );
    }

    return (
      <View
        style={[
          staticStyles.messageContainer,
          isCurrentUser ? dynamicStyles.messageRight : dynamicStyles.messageLeft,
          isMedia && staticStyles.mediaStyle,
          shouldAddMargin && !isMedia && { marginBottom: 10 },
        ]}
      >
        {item.type === "text" && (
          <Text style={isCurrentUser ? dynamicStyles.messageTextSelf : dynamicStyles.messageTextOther}>
            {item.content}
          </Text>
        )}

        {item.type === "image" && (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate(ROUTE_NAMES.CHAT.IMAGE_VIEWER, {
                imageUri: item.content,
                tag: `${item.id}-tag`,
              });
            }}
            style={{ minWidth: 150, minHeight: 150 }}
          >
            <Animated.Image
              source={{ uri: item.content }}
              resizeMode="cover"
              sharedTransitionTag={`${item.id}-tag`}
              style={staticStyles.imageMessage}
            />
          </TouchableOpacity>
        )}

        {(item.type === "audio" || item.type === "video") && (
          <Text style={isCurrentUser ? dynamicStyles.messageTextSelf : dynamicStyles.messageTextOther}>
            {item.type.toUpperCase()} message: {item.content}
          </Text>
        )}
        <Text style={[dynamicStyles.messageTime, isMedia ? dynamicStyles.mediaTime : null]}>
          {mapTime(new Date(item.time))}
        </Text>
      </View>
    );
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText("");
    shouldScrollToBottomRef.current = true;

    try {
      await sendText(text);
    } catch (e) {
      // send failure is surfaced by existing error patterns
    }
  };

  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[staticStyles.keyboardAvoiding, { paddingTop: insets.top, backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <StatusBar style="dark" />
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          onPress={navigation.goBack}
          style={{ marginLeft: 5 }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            navigation.navigate(ROUTE_NAMES.MENTORS.self, {
              screen: ROUTE_NAMES.MENTORS.MENTOR_DETAIL_SCREEN,
              params: { mentorId: chatDetail.mentorId },
            });
          }}
          style={staticStyles.profileImageWrapper}
        >
          <Image
            source={{ uri: chatDetail.avatar }}
            style={[staticStyles.avatar, { backgroundColor: colors.canvas }]}
            resizeMode="cover"
          />
          <Text style={dynamicStyles.headerTitle}>{chatDetail.name}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {messagesLoading && messages.length === 0 ? (
        <View style={[staticStyles.chatList, { paddingHorizontal: 16, paddingTop: 16 }]}>
          <Skeleton height={40} width="65%" radius={8} style={{ marginBottom: 10 }} />
          <Skeleton height={40} width="80%" radius={8} style={{ alignSelf: 'flex-end', marginBottom: 10 }} />
          <Skeleton height={56} width="70%" radius={8} style={{ marginBottom: 10 }} />
          <Skeleton height={40} width="55%" radius={8} style={{ alignSelf: 'flex-end', marginBottom: 10 }} />
        </View>
      ) : (
        <FlatList
          ref={chatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={staticStyles.chatList}
          contentContainerStyle={staticStyles.chatContentContainer}
          onContentSizeChange={() => {
            if (!shouldScrollToBottomRef.current) return;
            shouldScrollToBottomRef.current = false;
            requestAnimationFrame(() => scrollToBottom(true));
          }}
          ListFooterComponent={isMentorTyping ? <TypingIndicator /> : null}
        />
      )}
      <View style={{ marginBottom: 30 }} />
      <View style={dynamicStyles.inputContainer}>
        <ScrollView
          style={dynamicStyles.inputScrollView}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <TextInput
            style={dynamicStyles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Chat with your Coach..."
            placeholderTextColor={colors.textFaint}
            multiline={true}
            returnKeyType="default"
          />
        </ScrollView>
        <TouchableOpacity
          style={dynamicStyles.sendButton}
          onPress={handleSend}
          accessibilityLabel="Send message"
          accessibilityRole="button"
          disabled={!inputText.trim()}
        >
          <Ionicons
            name="send"
            size={18}
            color={colors.textWhite}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const staticStyles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  messageLeft: {
    alignSelf: "flex-start",
  },
  avatar: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    marginHorizontal: 8,
  },
  chatList: {
    flex: 1,
  },
  chatContentContainer: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    paddingBottom: 60,
    justifyContent: "flex-end",
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: "80%",
    marginVertical: 4,
    margin: 10,
    padding: 8,
    paddingLeft: 12,
    paddingRight: 20,
    borderRadius: 8,
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
    flexDirection: "row",
    alignItems: "center",
  },
  goalsCardContainer: {
    maxWidth: "80%",
    marginVertical: 4,
    margin: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  goalsCardGradient: {
    padding: 12,
  },
});
