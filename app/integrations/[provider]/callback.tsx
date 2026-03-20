import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { SessionGateScreen } from "@/src/features/app/SessionGateScreen";
import { isManagedProvider } from "@/src/lib/providers";

export default function IntegrationCallbackRoute() {
  const router = useRouter();
  const { provider } = useLocalSearchParams<{ provider?: string }>();
  const { authReady, authState, handleIntegrationCallback } = useMomentumSession();
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!provider || !isManagedProvider(provider)) {
      setError("This provider callback is not supported by the current mobile build.");
      return;
    }

    if (authState !== "authenticated") {
      router.replace("/(auth)/sign-in");
      return;
    }

    let cancelled = false;

    void handleIntegrationCallback(provider)
      .then(() => {
        if (!cancelled) {
          router.replace("/(app)/account");
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Unable to refresh provider state after the callback.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, authState, handleIntegrationCallback, provider, retryCount, router]);

  return (
    <SessionGateScreen
      title={error ? "Provider callback needs attention" : "Finishing provider callback"}
      message={
        error
          ? "The app could not finish the provider handoff."
          : "Refreshing the latest provider state and returning to account settings."
      }
      error={error}
      onRetry={() => {
        setError(null);
        setRetryCount((current) => current + 1);
      }}
    />
  );
}
