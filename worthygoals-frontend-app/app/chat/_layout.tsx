import { ROUTE_NAMES } from "@/constants/Routes";
import { Stack } from "expo-router";

export default function ChatLayout() {
    return (
        <Stack>
            <Stack.Screen name={ROUTE_NAMES.CHAT.CHAT_VIEW_SCREEN} options={{ headerShown: false }} />
            <Stack.Screen name={ROUTE_NAMES.CHAT.CHAT_SETTINGS_SCREEN} options={{ headerShown: false }} />
            <Stack.Screen name={ROUTE_NAMES.COMMON.IMAGE_VIEWER} options={{ headerShown: false, presentation: 'transparentModal', animation: 'simple_push', }} />
        </Stack>
    )

}