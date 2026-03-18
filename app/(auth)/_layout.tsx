import { Redirect, Stack } from "expo-router";

import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";

export default function AuthLayout() {
  const { authReady, authState } = useMomentumSession();

  if (!authReady) {
    return null;
  }

  if (authState === "authenticated" || authState === "demo") {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
