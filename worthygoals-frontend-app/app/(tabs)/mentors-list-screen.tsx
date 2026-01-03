import React, { useCallback, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";

import Background from "@/components/SubComponents/Background";
import MentorCard from "@/components/Mentors/MentorCard";
import mentorService from "@/services/mentor.service";
import { Mentor } from "@/models";
import { useFocusEffect, useNavigation } from "expo-router";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";
import { ROUTE_NAMES } from "@/constants";

export default function MentorsListWithBackground() {
  return (
    <Background style={styles.container}>
      <MentorsListScreen />
    </Background>
  );
}

function MentorsListScreen() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mentors</Text>
      </View>

      {!!error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
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
          />
        )}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading
                ? "Loading mentors..."
                : error
                ? ""
                : "Mentors not available!"}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerTitle: {
    color: "#fff",
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
  errorText: {
    color: "#ffb4b4",
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyText: {
    color: "#ccc",
  },
});
