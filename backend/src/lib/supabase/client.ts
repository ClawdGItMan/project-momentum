import { createClient, type User } from "@supabase/supabase-js";

import type { BackendEnv } from "../../config/env";

export function createSupabaseAdminClient(env: BackendEnv) {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function createSupabaseUserClient(env: BackendEnv, accessToken: string) {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export async function getUserFromAccessToken(
  env: BackendEnv,
  accessToken: string,
): Promise<User | null> {
  const client = createSupabaseUserClient(env, accessToken);
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}
