import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs } from "expo-router";
import { Dimensions, Platform, Pressable } from "react-native";

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
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

const { height } = Dimensions.get("window");
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
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
          title: "Home",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="info-circle"
                    size={25}
                    color={Colors[colorScheme ?? "light"].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name={ROUTE_NAMES.TABS.CHAT_LIST_SCREEN}
        options={{
          headerShown: false,
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="comments" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name={ROUTE_NAMES.TABS.MENTORS_LIST_SCREEN}
        options={{
          headerShown: false,
          title: "Mentors",
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
        }}
      />

      <Tabs.Screen
        name={ROUTE_NAMES.TABS.TODO_LIST_SCREEN}
        options={{
          headerShown: false,
          title: "To-do",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="check-square" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name={ROUTE_NAMES.TABS.INSPIRATION.self}
        options={{
          headerShown: false,
          title: "Inspiration",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="hacker-news" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
