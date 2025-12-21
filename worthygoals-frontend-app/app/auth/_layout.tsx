import { ROUTE_NAMES } from "@/constants";
import { useAuth } from "@/hooks";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function AuthLayout() {
  const { checkAuth } = useAuth();
  useEffect(() => {
    checkAuth().catch((e) => {
      console.error("Auth check failed:", e?.message || e);
    });
  }, []);

  return (
    <Stack>
      <Stack.Screen
        name={ROUTE_NAMES.AUTH.LOGIN}
        options={{
          headerShown: false,
          presentation: "modal",
          animationTypeForReplace: "push",
          animation: "slide_from_left",
        }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.AUTH.REGISTER}
        options={{
          headerShown: false,
          presentation: "modal",
          animationTypeForReplace: "push",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name={ROUTE_NAMES.AUTH.RESET_PASSWORD}
        options={{
          headerShown: true,
          title: "Reset Password",
          presentation: "modal",
          animationTypeForReplace: "push",
          animation: "slide_from_bottom",
        }}
      />

      <Stack.Screen
        name={ROUTE_NAMES.AUTH.VERIFY_EMAIL_SCREEN}
        options={{
          title: "Verify Email",
          headerShown: true,
          presentation: "modal",
          animationTypeForReplace: "push",
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name={ROUTE_NAMES.AUTH.NEW_PASSWORD_SCREEN}
        options={{
          title: "Create New Password",
          headerShown: true,
          presentation: "modal",
          animationTypeForReplace: "push",
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
