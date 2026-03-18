import { Redirect } from "expo-router";

import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";

export default function IndexRoute() {
  const { authReady, authState, onboardingComplete, sessionHydrated } = useMomentumSession();

  if (!sessionHydrated || !authReady) {
    return null;
  }

  if (authState === "signed-out") {
    return <Redirect href={"/(auth)/sign-in" as never} />;
  }

  return (
    <Redirect href={onboardingComplete ? "/(app)/home" : "/(onboarding)/welcome"} />
  );
}
