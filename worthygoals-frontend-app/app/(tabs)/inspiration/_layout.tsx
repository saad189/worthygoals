import { ROUTE_NAMES } from "@/constants/Routes";
import { Stack } from "expo-router";

export default function InspirationLayout() {
    return (
        <Stack>
            <Stack.Screen name={ROUTE_NAMES.TABS.INSPIRATION.DEFAULT_SCREEN} options={{ headerShown: false }} />
            <Stack.Screen name={ROUTE_NAMES.TABS.INSPIRATION.IMAGE_VIEWER} options={{ headerShown: false, presentation: 'transparentModal', animation: 'simple_push', }} />
        </Stack>
    )

}