import { ThemeProvider, type Theme } from "@react-navigation/native";
import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import "react-native-reanimated";
import "react-native-url-polyfill/auto";

import { fontFamilies, theme } from "@/src/design";
import { MomentumSessionProvider } from "@/src/features/app/MomentumSessionProvider";

SplashScreen.preventAutoHideAsync().catch(() => null);

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
      fontFamily: fontFamilies.sansRegular,
      fontWeight: "400",
    },
    medium: {
      fontFamily: fontFamilies.sansSemiBold,
      fontWeight: "600",
    },
    bold: {
      fontFamily: fontFamilies.sansBold,
      fontWeight: "700",
    },
    heavy: {
      fontFamily: fontFamilies.serifBold,
      fontWeight: "700",
    },
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [fontFamilies.serifSemiBold]: CormorantGaramond_600SemiBold,
    [fontFamilies.serifBold]: CormorantGaramond_700Bold,
    [fontFamilies.sansRegular]: Manrope_400Regular,
    [fontFamilies.sansMedium]: Manrope_500Medium,
    [fontFamilies.sansSemiBold]: Manrope_600SemiBold,
    [fontFamilies.sansBold]: Manrope_700Bold,
    [fontFamilies.sansExtraBold]: Manrope_800ExtraBold,
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.color.bg.canvas).catch(() => null);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => null);
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <MomentumSessionProvider>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="integrations/[provider]/callback" />
          <Stack.Screen name="modals" options={{ presentation: "modal" }} />
        </Stack>
      </ThemeProvider>
    </MomentumSessionProvider>
  );
}
