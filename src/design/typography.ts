import { Platform, TextStyle } from "react-native";

const iosFaces = {
  display: "AvenirNext-Heavy",
  heading: "AvenirNext-DemiBold",
  body: "AvenirNext-Regular",
  metric: "Menlo",
};

const androidFaces = {
  display: "sans-serif-black",
  heading: "sans-serif-medium",
  body: "sans-serif",
  metric: "monospace",
};

const face = Platform.select({
  ios: iosFaces,
  android: androidFaces,
  default: androidFaces,
});

export const typography = {
  hero: {
    fontFamily: face.display,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.8,
  } satisfies TextStyle,
  title: {
    fontFamily: face.heading,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
  } satisfies TextStyle,
  heading: {
    fontFamily: face.heading,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  } satisfies TextStyle,
  body: {
    fontFamily: face.body,
    fontSize: 16,
    lineHeight: 24,
  } satisfies TextStyle,
  bodySmall: {
    fontFamily: face.body,
    fontSize: 14,
    lineHeight: 20,
  } satisfies TextStyle,
  caption: {
    fontFamily: face.body,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  } satisfies TextStyle,
  label: {
    fontFamily: face.heading,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.1,
  } satisfies TextStyle,
  button: {
    fontFamily: face.heading,
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: 0.3,
  } satisfies TextStyle,
  metric: {
    fontFamily: face.metric,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0.2,
  } satisfies TextStyle,
  metricLarge: {
    fontFamily: face.metric,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: 0.1,
  } satisfies TextStyle,
} as const;

export type TypographyRole = keyof typeof typography;

