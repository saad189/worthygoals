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
import Background from "@/components/SubComponents/Background";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function TodoCreateWithBackground() {
  return (
    <Background style={staticStyles.container}>
      <TodoCreateScreen />
    </Background>
  );
}

function TodoCreateScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  return (
    <SafeAreaView style={staticStyles.container}>
      <View style={[staticStyles.header, { borderBottomColor: colors.border }]}>
        <Text style={[staticStyles.headerTitle, { color: colors.textWhite }]}>Create To-do</Text>
      </View>

      <View style={staticStyles.body}>
        <Text style={[staticStyles.text, { color: colors.textWhite }]}>Dummy screen for now.</Text>

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
