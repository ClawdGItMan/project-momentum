import { useEffect, useState } from "react";
import { Redirect, Stack } from "expo-router";
import { Platform } from "react-native";

import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { SessionGateScreen } from "@/src/features/app/SessionGateScreen";

export default function OnboardingLayout() {
  const [clientMounted, setClientMounted] = useState(false);
  const {
    authReady,
    authState,
    bootstrapError,
    bootstrapStatus,
    refreshFromBackend,
    sessionHydrated,
    signOut,
  } = useMomentumSession();
  const stackOptions = {
    headerShown: false,
    animation: "slide_from_right" as const,
  };

  useEffect(() => {
    setClientMounted(true);
  }, []);

  if (!clientMounted || !sessionHydrated || !authReady) {
    if (Platform.OS === "web") {
      return <Stack screenOptions={stackOptions} />;
    }
    return (
      <SessionGateScreen
        title="Preparing onboarding"
        message="Restoring your session before setup continues."
      />
    );
  }

  if (authState === "signed-out") {
    return <Redirect href={"/(auth)/sign-in" as never} />;
  }

  if (authState === "demo" || bootstrapStatus === "ready") {
    return <Redirect href="/(app)/home" />;
  }

  if (bootstrapStatus === "idle" || bootstrapStatus === "loading") {
    return (
      <SessionGateScreen
        title="Loading setup"
        message="Checking whether this account already finished onboarding."
      />
    );
  }

  if (bootstrapStatus === "error") {
    return (
      <SessionGateScreen
        title="Setup needs a retry"
        message="Momentum could not verify this account's setup state yet."
        error={bootstrapError}
        onRetry={() => void refreshFromBackend()}
        onSignOut={() => void signOut()}
      />
    );
  }

  return (
    <Stack screenOptions={stackOptions} />
  );
}
