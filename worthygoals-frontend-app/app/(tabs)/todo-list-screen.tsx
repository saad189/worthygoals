import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Background from "@/components/SubComponents/Background";
import { useNavigation } from "expo-router";
import { StackNavigationProp } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";
import { ROUTE_NAMES } from "@/constants";

export default function TodoListWithBackground() {
  return (
    <Background style={styles.container}>
      <TodoListScreen />
    </Background>
  );
}

function TodoListScreen() {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>To-do</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.text}>Dummy for now.</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate(ROUTE_NAMES.TODO.self, {
              screen: ROUTE_NAMES.TODO.TODO_CREATE_SCREEN,
            })
          }
        >
          <Text style={styles.buttonText}>Create To-do</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate(ROUTE_NAMES.TODO.self, {
              screen: ROUTE_NAMES.TODO.TODO_DETAIL_SCREEN,
              params: { todoId: "dummy" },
            })
          }
        >
          <Text style={styles.buttonText}>Open To-do Detail</Text>
        </TouchableOpacity>
      </View>
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
  body: {
    padding: 16,
    gap: 12,
  },
  text: {
    color: "#fff",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#E65581",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
