import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { useAppTheme } from "@/hooks/useAppTheme";

export default function TodoListWithBackground() {
  return (
    <Background style={staticStyles.container}>
      <TodoListScreen />
    </Background>
  );
}

function TodoListScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaView style={staticStyles.container}>
      <View style={[staticStyles.header, { borderBottomColor: colors.border }]}>
        <Text style={[staticStyles.headerTitle, { color: colors.textWhite }]}>To-do</Text>
      </View>

      <View style={staticStyles.body}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.textWhite} />
        ) : (
          <Text style={[staticStyles.text, { color: colors.textWhite }]}>Dummy for now.</Text>
        )}

        <TouchableOpacity
          style={[staticStyles.button, { backgroundColor: colors.primary }]}
          onPress={() =>
            navigation.navigate(ROUTE_NAMES.TODO.self, {
              screen: ROUTE_NAMES.TODO.TODO_CREATE_SCREEN,
            })
          }
        >
          <Text style={[staticStyles.buttonText, { color: colors.textWhite }]}>Create To-do</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[staticStyles.button, { backgroundColor: colors.primary }]}
          onPress={() =>
            navigation.navigate(ROUTE_NAMES.TODO.self, {
              screen: ROUTE_NAMES.TODO.TODO_DETAIL_SCREEN,
              params: { todoId: "dummy" },
            })
          }
        >
          <Text style={[staticStyles.buttonText, { color: colors.textWhite }]}>Open To-do Detail</Text>
        </TouchableOpacity>
      </View>
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
  body: {
    padding: 16,
    gap: 12,
  },
  text: {},
  button: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  buttonText: {
    fontWeight: "700",
  },
});
