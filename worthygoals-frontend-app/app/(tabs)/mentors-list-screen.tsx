import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Background from "@/components/SubComponents/Background";
import MentorCard from "@/components/Mentors/MentorCard";
import mentorService from "@/services/mentor.service";
import conversationsService from "@/services/conversations.service";
import { Mentor } from "@/models";
import { useFocusEffect, useNavigation } from "expo-router";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";
import { ROUTE_NAMES } from "@/constants";
import { formatErrorMessage } from "@/helpers";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function MentorsListWithBackground() {
  return (
    <Background style={staticStyles.container}>
      <MentorsListScreen />
    </Background>
  );
}

function MentorsListScreen() {
  const { colors } = useAppTheme();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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
    }, [])
  );

  return (
    <SafeAreaView style={staticStyles.container}>
      <View style={[staticStyles.header, { borderBottomColor: colors.border }]}>
        <Text style={[staticStyles.headerTitle, { color: colors.textWhite }]}>Mentors</Text>
      </View>

      {!!error && (
        <View style={staticStyles.errorContainer}>
          <Text style={[staticStyles.errorText, { color: colors.notificationError }]}>{error}</Text>
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
              <ActivityIndicator size="small" color={colors.textWhite} />
            ) : (
              <Text style={[staticStyles.emptyText, { color: colors.textFaint }]}>
                {error ? "" : "Mentors not available!"}
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
    flexGrow: 1,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorText: {},
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyText: {},
});
