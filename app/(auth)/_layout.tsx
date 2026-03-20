import { useEffect, useState } from "react";
import { Redirect, Stack } from "expo-router";
import { Platform } from "react-native";

import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { SessionGateScreen } from "@/src/features/app/SessionGateScreen";

export default function AuthLayout() {
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
  const stackOptions = { headerShown: false, animation: "fade" as const };

  useEffect(() => {
    setClientMounted(true);
  }, []);

  if (!clientMounted || !sessionHydrated || !authReady) {
    if (Platform.OS === "web") {
      return <Stack screenOptions={stackOptions} />;
    }
    return (
      <SessionGateScreen
        title="Preparing sign-in"
        message="Checking for an existing session before showing the auth screens."
      />
    );
  }

  if (authState === "signed-out") {
    return <Stack screenOptions={stackOptions} />;
  }

  if (authState === "demo") {
    return <Redirect href="/(app)/home" />;
  }

  if (bootstrapStatus === "idle" || bootstrapStatus === "loading") {
    return (
      <SessionGateScreen
        title="Loading your account"
        message="Momentum is checking whether this account needs setup or can enter the app."
      />
    );
  }

  if (bootstrapStatus === "error") {
    return (
      <SessionGateScreen
        title="Account needs a retry"
        message="Momentum could not load the current account yet."
        error={bootstrapError}
        onRetry={() => void refreshFromBackend()}
        onSignOut={() => void signOut()}
      />
    );
  }

  return <Redirect href={bootstrapStatus === "ready" ? "/(app)/home" : "/(onboarding)/welcome"} />;
}
