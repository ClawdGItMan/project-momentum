import { ThemeProvider, type Theme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import "react-native-reanimated";

import { theme } from "@/src/design";
import { MomentumSessionProvider } from "@/src/features/app/MomentumSessionProvider";

const navigationTheme: Theme = {
  dark: false,
  colors: {
    primary: theme.color.accent.energy,
    background: theme.color.bg.canvas,
    card: theme.color.bg.surface,
    text: theme.color.fg.primary,
    border: theme.color.stroke.subtle,
    notification: theme.color.accent.energy,
  },
  fonts: {
    regular: {
      fontFamily: "System",
      fontWeight: "400",
    },
    medium: {
      fontFamily: "System",
      fontWeight: "500",
    },
    bold: {
      fontFamily: "System",
      fontWeight: "700",
    },
    heavy: {
      fontFamily: "System",
      fontWeight: "800",
    },
  },
};

export default function RootLayout() {
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.color.bg.canvas).catch(() => null);
  }, []);

  return (
    <MomentumSessionProvider>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="modals" options={{ presentation: "modal" }} />
        </Stack>
      </ThemeProvider>
    </MomentumSessionProvider>
  );
}
