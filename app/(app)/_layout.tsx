import { useEffect, useState } from "react";
import { Redirect, Tabs } from "expo-router";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";
import { SessionGateScreen } from "@/src/features/app/SessionGateScreen";

export default function AppTabsLayout() {
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
        title="Loading Momentum"
        message="Restoring your private account before the app shell opens."
      />
    );
  }

  if (authState === "signed-out") {
    return <Redirect href={"/(auth)/sign-in" as never} />;
  }

  if (authState !== "demo" && (bootstrapStatus === "idle" || bootstrapStatus === "loading")) {
    return (
      <SessionGateScreen
        title="Loading Momentum"
        message="Restoring your private account before the app shell opens."
      />
    );
  }

  if (authState !== "demo" && bootstrapStatus === "error") {
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

  if (authState !== "demo" && bootstrapStatus !== "ready") {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.accent.energy,
        tabBarInactiveTintColor: theme.color.fg.muted,
        tabBarStyle: {
          backgroundColor: theme.color.bg.surface,
          borderTopColor: theme.color.stroke.subtle,
          borderTopWidth: theme.borderWidth.hairline,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen name="home/index" options={{ title: "Home" }} />
      <Tabs.Screen name="check-in/index" options={{ title: "Check in" }} />
      <Tabs.Screen name="character/index" options={{ title: "Character" }} />
      <Tabs.Screen name="habits/index" options={{ title: "Habits" }} />
      <Tabs.Screen name="profile/index" options={{ title: "Profile" }} />
      <Tabs.Screen name="squads/index" options={{ title: "Squads" }} />
      <Tabs.Screen
        name="account/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="connections/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="squads/[squadId]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
