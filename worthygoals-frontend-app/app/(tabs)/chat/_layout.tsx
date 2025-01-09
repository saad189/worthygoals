import { ROUTE_NAMES } from "@/constants/Routes";
import { Stack } from "expo-router";

export default function ChatLayout() {
    const { CHAT_VIEW_SCREEN, CHAT_LIST_SCREEN, CHAT_SETTINGS_SCREEN, IMAGE_VIEWER } = ROUTE_NAMES.TABS.CHAT;
    return (
        <Stack>
            <Stack.Screen name={CHAT_LIST_SCREEN} options={{ title: 'Mentors' }} />
            <Stack.Screen name={CHAT_VIEW_SCREEN} options={{ headerShown: false }} />
            <Stack.Screen name={CHAT_SETTINGS_SCREEN} options={{ headerShown: false }} />
            <Stack.Screen name={IMAGE_VIEWER} options={{ headerShown: false, presentation: 'transparentModal', animation: 'simple_push', }} />
        </Stack>
    )

}