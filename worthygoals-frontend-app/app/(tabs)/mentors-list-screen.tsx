import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

import { Button, Header, Screen, Text } from "@/components/ui";
import MentorCard from "@/components/Mentors/MentorCard";
import mentorService from "@/services/mentor.service";
import conversationsService from "@/services/conversations.service";
import { Mentor } from "@/models";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";
import { ROUTE_NAMES } from "@/constants";
import { formatErrorMessage } from "@/helpers";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function MentorsListScreen() {
  const { colors, space } = useAppTheme();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  // Bumped by "Try again" to re-run the focus fetch.
  const [attempt, setAttempt] = useState(0);
  const [startingChatMentorId, setStartingChatMentorId] = useState<
    number | null
  >(null);
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      setLoading(true);

      mentorService
        .getMentorList()
        .then((data) => {
          if (!isMounted) return;
          setMentors(data);
          setError(null);
          setLoading(false);
        })
        .catch((e: any) => {
          if (!isMounted) return;
          setError(e?.message ?? "Failed to load mentors");
          setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }, [attempt])
  );

  return (
    <Screen padded={false} edges={["top"]}>
      <Header
        title="team"
        eyebrow="your mentors"
        // The inbox (last message per mentor) was built but had no way in —
        // its tab is hidden. It belongs with the mentors it lists.
        right={
          <TouchableOpacity
            onPress={() =>
              router.navigate(`/${ROUTE_NAMES.TABS.self}/${ROUTE_NAMES.TABS.CHAT_LIST_SCREEN}` as never)
            }
            accessibilityRole="button"
            accessibilityLabel="Messages"
            hitSlop={12}
          >
            <Text variant="label" color="textMuted">
              messages ›
            </Text>
          </TouchableOpacity>
        }
        style={{ paddingHorizontal: space["5"], marginBottom: space["3"] }}
      />

      {!!error && (
        <View style={[staticStyles.errorContainer, { paddingHorizontal: space["5"], gap: space["4"] }]}>
          <Text variant="muted" color="dangerColor">
            {error}
          </Text>
          <Button label="Try again" variant="secondary" onPress={() => setAttempt((a) => a + 1)} />
        </View>
      )}

      <FlatList
        data={mentors}
        renderItem={({ item }) => (
          <MentorCard
            mentor={item}
            onPress={() =>
              navigation.navigate(ROUTE_NAMES.MENTORS.self, {
                screen: ROUTE_NAMES.MENTORS.MENTOR_DETAIL_SCREEN,
                params: { mentorId: item.id },
              })
            }
            chatLoading={startingChatMentorId === item.id}
            onChatPress={async () => {
              try {
                setStartingChatMentorId(item.id);
                const data =
                  await conversationsService.getConversationShellByMentorId(
                    item.id
                  );
                navigation.navigate(ROUTE_NAMES.CHAT.self, {
                  screen: ROUTE_NAMES.CHAT.CHAT_VIEW_SCREEN,
                  params: { chatData: data },
                });
              } catch (e: any) {
                Alert.alert("Couldn't start chat", formatErrorMessage(e));
              } finally {
                setStartingChatMentorId(null);
              }
            }}
          />
        )}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={staticStyles.listContent}
        ListEmptyComponent={() => (
          <View style={staticStyles.emptyContainer}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text variant="muted">
                {error ? "" : "No mentors available yet."}
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
    flexGrow: 1,
  },
  errorContainer: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
});
