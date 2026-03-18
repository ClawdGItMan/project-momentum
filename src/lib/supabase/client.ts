import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

import { supabaseAnonKey, supabaseUrl } from "./config";

const memoryStorage = new Map<string, string>();

const storage = {
  getItem: (key: string) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") {
        return Promise.resolve(memoryStorage.get(key) ?? null);
      }

      return Promise.resolve(window.localStorage.getItem(key));
    }

    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") {
        memoryStorage.set(key, value);
        return Promise.resolve();
      }

      window.localStorage.setItem(key, value);
      return Promise.resolve();
    }

    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") {
        memoryStorage.delete(key);
        return Promise.resolve();
      }

      window.localStorage.removeItem(key);
      return Promise.resolve();
    }

    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

let authRefreshBound = false;

export function ensureSupabaseSessionRefresh() {
  if (authRefreshBound) return;
  authRefreshBound = true;

  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      void supabase.auth.startAutoRefresh();
      return;
    }

    void supabase.auth.stopAutoRefresh();
  });
}
