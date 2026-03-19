import { Redirect, Tabs } from "expo-router";

import { theme } from "@/src/design";
import { useMomentumSession } from "@/src/features/app/MomentumSessionProvider";

export default function AppTabsLayout() {
  const { authReady, authState, onboardingComplete, sessionHydrated } = useMomentumSession();

  if (!sessionHydrated || !authReady) {
    return null;
  }

  if (authState === "signed-out") {
    return <Redirect href={"/(auth)/sign-in" as never} />;
  }

  if (!onboardingComplete) {
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
      <Tabs.Screen name="habits/index" options={{ title: "Habits" }} />
      <Tabs.Screen name="profile/index" options={{ title: "Profile" }} />
      <Tabs.Screen name="squads/index" options={{ title: "Squads" }} />
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
