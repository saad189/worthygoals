import { ROUTE_NAMES } from "@/constants/Routes";
import { Stack } from "expo-router";

export default function JourneyLayout() {

    return (
        <Stack>
            <Stack.Screen name={ROUTE_NAMES.JOURNEY.INTRO_SCREEN} options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name={ROUTE_NAMES.JOURNEY.SELECT_DISCIPLINE_SCREEN} options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name={ROUTE_NAMES.JOURNEY.PROVIDE_INFO_SCREEN} options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name={ROUTE_NAMES.JOURNEY.PROCESSING_SCREEN} options={{ headerShown: false, animation: 'slide_from_right' }} />
        </Stack>
    )

}