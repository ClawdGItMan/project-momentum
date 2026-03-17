import { Redirect, Stack } from "expo-router";

import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";

export default function OnboardingLayout() {
  const { onboardingComplete, sessionHydrated } = useMomentumSession();

  if (!sessionHydrated) {
    return null;
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
