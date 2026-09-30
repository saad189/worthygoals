import { ROUTE_NAMES } from "@/constants/Routes";
import { useSlide } from '@/hooks/useMotion';
import { Stack } from "expo-router";

export default function JourneyLayout() {
  const slide = useSlide();
    return (
        <Stack screenOptions={{ headerShown: false, animation: slide('slide_from_right') }}>
            <Stack.Screen name={ROUTE_NAMES.JOURNEY.INTRO_SCREEN} />
            <Stack.Screen name={ROUTE_NAMES.JOURNEY.TONE_TEST_SCREEN} />
            <Stack.Screen name={ROUTE_NAMES.JOURNEY.YOUR_TEAM_SCREEN} />
            <Stack.Screen name={ROUTE_NAMES.JOURNEY.CONFIRM_SCREEN} options={{ animation: 'fade' }} />
        </Stack>
    );
}
