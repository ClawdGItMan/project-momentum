import { Redirect, Stack } from "expo-router";

import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";

export default function OnboardingLayout() {
  const { authReady, authState, onboardingComplete, sessionHydrated } = useMomentumSession();

  if (!sessionHydrated || !authReady) {
    return null;
  }

  if (authState === "signed-out") {
    return <Redirect href={"/(auth)/sign-in" as never} />;
  }

  if (onboardingComplete) {
    return <Redirect href="/(app)/home" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}
