import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "expo-router";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import Background from "@/components/SubComponents/Background";
import { ROUTE_NAMES } from "@/constants";

export default function TodoDetailWithBackground() {
  return (
    <Background style={styles.container}>
      <TodoDetailScreen />
    </Background>
  );
}

function TodoDetailScreen() {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const route = useRoute() as any;
  const todoId = route?.params?.todoId ?? "";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>To-do Detail</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.text}>Dummy screen for now.</Text>
        <Text style={styles.text}>To-do: {String(todoId)}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate(ROUTE_NAMES.TODO.self, {
              screen: ROUTE_NAMES.TODO.TODO_EDIT_SCREEN,
              params: { todoId: todoId || "dummy" },
            })
          }
        >
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={navigation.goBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  body: {
    padding: 16,
    gap: 12,
  },
  text: { color: "#fff" },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#E65581",
    alignSelf: "flex-start",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
