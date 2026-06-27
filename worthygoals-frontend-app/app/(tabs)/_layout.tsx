import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { Dimensions, Platform } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { ROUTE_NAMES } from "@/constants/Routes";
import { Colors } from "@/constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={26} style={{ marginBottom: -3 }} {...props} />;
}

const { height } = Dimensions.get("window");
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      // Hi-Fi tab set (Q4): today · goals · team · feed · me.
      // Chat is intentionally NOT a top-level tab — conversation lives inside a
      // mentor (team → mentor) and inside failure/status flows.
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].background,

          ...Platform.select({
            android: {
              paddingBottom: 10,
              height: insets.bottom + 70,
            },
            ios: {
              height: insets.bottom + 50,
            },
          }),
        },

        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name={ROUTE_NAMES.TABS.HOME_SCREEN}
        options={{
          headerShown: false,
          title: "today",
          tabBarIcon: ({ color }) => <TabBarIcon name="sun-o" color={color} />,
        }}
      />

      <Tabs.Screen
        name={ROUTE_NAMES.TABS.TODO_LIST_SCREEN}
        options={{
          headerShown: false,
          title: "goals",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="bullseye" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name={ROUTE_NAMES.TABS.MENTORS_LIST_SCREEN}
        options={{
          headerShown: false,
          title: "team",
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
        }}
      />

      <Tabs.Screen
        name={ROUTE_NAMES.TABS.FEED_SCREEN}
        options={{
          headerShown: false,
          title: "feed",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="th-large" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name={ROUTE_NAMES.TABS.ME_SCREEN}
        options={{
          headerShown: false,
          title: "me",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />

      {/* Chat list is no longer a top-level tab (Q4). Keep the route registered
          but off the bar so any lingering deep-link still resolves. */}
      <Tabs.Screen
        name={ROUTE_NAMES.TABS.CHAT_LIST_SCREEN}
        options={{ href: null, headerShown: false }}
      />
    </Tabs>
  );
}
