import { ROUTE_NAMES } from "@/constants/Routes";
import { Stack } from "expo-router";

export default function GoalSelectionLayout() {
    return (
        <Stack>
            <Stack.Screen name={ROUTE_NAMES.GOAL_SELECTION.SELECTION_SCREEN} options={{ headerShown: false, animation: 'slide_from_left' }} />
        </Stack>
    )

}