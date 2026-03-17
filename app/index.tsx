import { Redirect } from "expo-router";

import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";

export default function IndexRoute() {
  const { onboardingComplete, sessionHydrated } = useMomentumSession();

  if (!sessionHydrated) {
    return null;
  }

  return (
    <Redirect href={onboardingComplete ? "/(app)/home" : "/(onboarding)/welcome"} />
  );
}
