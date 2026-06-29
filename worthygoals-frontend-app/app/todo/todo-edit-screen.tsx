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
import { useAppTheme } from "@/hooks/useAppTheme";

export default function TodoEditWithBackground() {
  return (
    <Background style={staticStyles.container}>
      <TodoEditScreen />
    </Background>
  );
}

function TodoEditScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();
  const route = useRoute() as any;
  const todoId = route?.params?.todoId ?? "";

  return (
    <SafeAreaView style={staticStyles.container}>
      <View style={[staticStyles.header, { borderBottomColor: colors.border }]}>
        <Text style={[staticStyles.headerTitle, { color: colors.text }]}>Edit To-do</Text>
      </View>

      <View style={staticStyles.body}>
        <Text style={[staticStyles.text, { color: colors.text }]}>Dummy screen for now.</Text>
        <Text style={[staticStyles.text, { color: colors.text }]}>To-do: {String(todoId)}</Text>

        <TouchableOpacity
          style={[staticStyles.button, { backgroundColor: colors.primary }]}
          onPress={navigation.goBack}
        >
          <Text style={[staticStyles.buttonText, { color: colors.textWhite }]}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const staticStyles = StyleSheet.create({
  container: { flex: 1 },
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
    alignSelf: "flex-start",
  },
  buttonText: { fontWeight: "700" },
});
