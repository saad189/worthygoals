/**
 * Mentor profile (Hi-Fi). Replaces the legacy tabbed "AI <name>" screen whose
 * "Set New Goals" tab hosted the old Goal Title / Category / Duration form
 * (the parity image #1). Goal creation now routes into the Hi-Fi wizard
 * (todo-create) like every other entry point — there is no second goal form.
 *
 * This screen is a read-only profile: mentor identity in-voice, with two CTAs —
 * set a goal with this mentor, or open a 1:1 chat. Built from the ui/ primitives;
 * role + sample line come from the local PERSONALITIES roster (slug === personalityId)
 * so it reads correctly even when the backend description is thin.
 */
import React, { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  ParamListBase,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

import { Button, Card, MentorAvatar, Screen, Text } from "@/components/ui";
import { useAppTheme } from "@/hooks/useAppTheme";
import { ROUTE_NAMES } from "@/constants";
import mentorService from "@/services/mentor.service";
import conversationsService from "@/services/conversations.service";
import { personaBySlug } from "@/constants/Personalities";
import { formatErrorMessage } from "@/helpers";
import { Mentor } from "@/models";

export default function MentorDetailScreen() {
  const { colors, space } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const route = useRoute() as any;
  const mentorId = Number(route?.params?.mentorId);

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [startingChat, setStartingChat] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!mentorId) return;
      let active = true;
      mentorService.getMentorById(mentorId).then((data: Mentor | null) => {
        if (active && data) setMentor(data);
      });
      return () => {
        active = false;
      };
    }, [mentorId])
  );

  const persona = personaBySlug(mentor?.slug);
  const name = mentor?.name ?? persona?.name ?? "Your mentor";
  const role = persona?.role ?? mentor?.title ?? "";
  const voice = persona?.sampleLine ?? mentor?.shortDescription ?? "";
  const about = mentor?.longDescription ?? mentor?.shortDescription ?? "";

  // Every "new goal" intent funnels into the one Hi-Fi wizard.
  const setGoal = () =>
    navigation.navigate(ROUTE_NAMES.TODO.self as any, {
      screen: ROUTE_NAMES.TODO.TODO_CREATE_SCREEN,
    });

  const startChat = async () => {
    if (!mentor) return;
    try {
      setStartingChat(true);
      const chatData = await conversationsService.getConversationShellByMentorId(
        mentor.id
      );
      navigation.navigate(ROUTE_NAMES.CHAT.self as any, {
        screen: ROUTE_NAMES.CHAT.CHAT_VIEW_SCREEN,
        params: { chatData },
      });
    } catch (e: any) {
      Alert.alert("Couldn't start chat", formatErrorMessage(e));
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <Screen scroll>
      <Pressable
        onPress={navigation.goBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={styles.back}
        hitSlop={8}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <View style={styles.identity}>
        <MentorAvatar mentor={mentor?.slug ?? persona?.slug} size={88} />
        <Text variant="display" style={{ marginTop: space["4"] }}>
          {name}
        </Text>
        {role ? (
          <Text variant="eyebrow" style={{ marginTop: space["2"] }}>
            {role}
          </Text>
        ) : null}
      </View>

      {voice ? (
        <Card style={{ marginTop: space["6"] }}>
          <Text variant="eyebrow" style={{ marginBottom: space["2"] }}>
            {name}
          </Text>
          <Text variant="display" style={styles.voice}>
            {`"${voice}"`}
          </Text>
        </Card>
      ) : null}

      {about ? (
        <Text variant="body" color="textMuted" style={{ marginTop: space["5"] }}>
          {about}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button label={`Set a goal with ${name}`} onPress={setGoal} />
        <Button
          label={`Chat with ${name}`}
          variant="link"
          onPress={startChat}
          loading={startingChat}
          disabled={!mentor || startingChat}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: "flex-start", padding: 4, marginBottom: 8 },
  identity: { alignItems: "center", marginTop: 8 },
  voice: { fontSize: 20, lineHeight: 28 },
  actions: { marginTop: 36, gap: 8 },
});
