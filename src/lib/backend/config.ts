import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";

function normalizeUrl(value: string) {
  return value.trim().replace(/\/+$/u, "");
}

function getHostFromExpo() {
  const explicitHost =
    Constants.expoConfig?.hostUri ??
    (
      Constants as typeof Constants & {
        manifest2?: {
          extra?: {
            expoClient?: {
              hostUri?: string;
            };
          };
        };
      }
    ).manifest2?.extra?.expoClient?.hostUri;

  if (explicitHost) {
    return explicitHost.split(":")[0] ?? null;
  }

  const scriptUrl = (
    NativeModules as typeof NativeModules & {
      SourceCode?: {
        scriptURL?: string;
      };
    }
  ).SourceCode?.scriptURL;

  if (!scriptUrl) {
    return null;
  }

  const match = scriptUrl.match(/^https?:\/\/([^/:]+)(?::\d+)?\//u);
  return match?.[1] ?? null;
}

export function getBackendUrl() {
  const explicit = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
  if (explicit) {
    return normalizeUrl(explicit);
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return normalizeUrl(`${window.location.protocol}//${window.location.hostname}:8787`);
  }

  const host = getHostFromExpo();
  if (host) {
    return `http://${host}:8787`;
  }

  return "http://localhost:8787";
}
