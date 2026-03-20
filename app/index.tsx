import { useEffect, useState } from "react";
import { Redirect } from "expo-router";

import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { SessionGateScreen } from "@/src/features/app/SessionGateScreen";

export default function IndexRoute() {
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

  useEffect(() => {
    setClientMounted(true);
  }, []);

  if (!clientMounted || !sessionHydrated || !authReady) {
    return (
      <SessionGateScreen
        title="Preparing Momentum"
        message="Restoring your session and checking which flow this account belongs in."
      />
    );
  }

  if (authState === "signed-out") {
    return <Redirect href={"/(auth)/sign-in" as never} />;
  }

  if (authState === "demo") {
    return <Redirect href="/(app)/home" />;
  }

  if (bootstrapStatus === "idle" || bootstrapStatus === "loading") {
    return (
      <SessionGateScreen
        title="Preparing Momentum"
        message="Restoring your session and checking which flow this account belongs in."
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
