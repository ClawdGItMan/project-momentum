import { TextStyle } from "react-native";

export const fontFamilies = {
  serifSemiBold: "CormorantGaramond-SemiBold",
  serifBold: "CormorantGaramond-Bold",
  sansRegular: "Manrope-Regular",
  sansMedium: "Manrope-Medium",
  sansSemiBold: "Manrope-SemiBold",
  sansBold: "Manrope-Bold",
  sansExtraBold: "Manrope-ExtraBold",
} as const;

export const typography = {
  hero: {
    fontFamily: fontFamilies.serifSemiBold,
    fontSize: 46,
    lineHeight: 48,
    letterSpacing: -0.9,
  } satisfies TextStyle,
  title: {
    fontFamily: fontFamilies.serifSemiBold,
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -0.6,
  } satisfies TextStyle,
  heading: {
    fontFamily: fontFamilies.sansExtraBold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  } satisfies TextStyle,
  body: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 17,
    lineHeight: 28,
  } satisfies TextStyle,
  bodySmall: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 15,
    lineHeight: 24,
  } satisfies TextStyle,
  caption: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  } satisfies TextStyle,
  label: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.5,
  } satisfies TextStyle,
  button: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: 0.2,
  } satisfies TextStyle,
  metric: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.4,
  } satisfies TextStyle,
  metricLarge: {
    fontFamily: fontFamilies.sansExtraBold,
    fontSize: 42,
    lineHeight: 44,
    letterSpacing: -0.9,
  } satisfies TextStyle,
} as const;

export type TypographyRole = keyof typeof typography;
