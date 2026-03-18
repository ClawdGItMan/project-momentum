import { createEncryptionKeyMaterial } from "./crypto";
import type {
  BackendNodeEnv,
  BackendSecurityEnv,
  ProviderScopeConfig,
} from "./types";

export type EnvSource = Record<string, string | undefined>;

export function readRequiredEnv(name: string, env: EnvSource = process.env): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function readOptionalEnv(
  name: string,
  env: EnvSource = process.env,
): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

export function readEnumEnv<T extends string>(
  name: string,
  allowed: readonly T[],
  env: EnvSource = process.env,
): T {
  const value = readRequiredEnv(name, env);
  if (!allowed.includes(value as T)) {
    throw new Error(
      `Invalid value for ${name}: ${value}. Expected one of ${allowed.join(", ")}.`,
    );
  }
  return value as T;
}

export function readBooleanEnv(
  name: string,
  env: EnvSource = process.env,
  defaultValue = false,
): boolean {
  const value = readOptionalEnv(name, env);
  if (value == null) return defaultValue;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function readIntegerEnv(
  name: string,
  env: EnvSource = process.env,
  defaultValue?: number,
): number {
  const value = readOptionalEnv(name, env);
  if (value == null) {
    if (defaultValue == null) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return defaultValue;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer.`);
  }
  return parsed;
}

export function readUrlEnv(name: string, env: EnvSource = process.env): string {
  const value = readRequiredEnv(name, env);
  try {
    const url = new URL(value);
    return url.toString().replace(/\/+$/u, "");
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL.`);
  }
}

export function readOptionalUrlEnv(
  name: string,
  env: EnvSource = process.env,
): string | undefined {
  const value = readOptionalEnv(name, env);
  if (!value) return undefined;
  try {
    return new URL(value).toString().replace(/\/+$/u, "");
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL if provided.`);
  }
}

function readProviderScope(prefix: string, env: EnvSource = process.env): ProviderScopeConfig {
  return {
    clientId: readOptionalEnv(`${prefix}_CLIENT_ID`, env),
    clientSecret: readOptionalEnv(`${prefix}_CLIENT_SECRET`, env),
    webhookVerifyToken: readOptionalEnv(`${prefix}_WEBHOOK_VERIFY_TOKEN`, env),
    webhookSecret: readOptionalEnv(`${prefix}_WEBHOOK_SECRET`, env),
  };
}

export function loadBackendSecurityEnv(env: EnvSource = process.env): BackendSecurityEnv {
  const nodeEnv = readEnumEnv<BackendNodeEnv>(
    "NODE_ENV",
    ["development", "test", "production"],
    env,
  );
  const tokenEncryptionKey = createEncryptionKeyMaterial(
    readRequiredEnv("TOKEN_ENCRYPTION_KEY_BASE64", env),
    readOptionalEnv("TOKEN_ENCRYPTION_KEY_ID", env) ?? "current",
  );

  return {
    nodeEnv,
    backendPublicUrl: readOptionalUrlEnv("BACKEND_PUBLIC_URL", env),
    corsOrigin: readOptionalUrlEnv("CORS_ORIGIN", env),
    databaseUrl: readUrlEnv("DATABASE_URL", env),
    supabaseUrl: readUrlEnv("SUPABASE_URL", env),
    supabaseAnonKey: readRequiredEnv("SUPABASE_ANON_KEY", env),
    supabaseServiceRoleKey: readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY", env),
    sessionSecret: readRequiredEnv("SESSION_SECRET", env),
    tokenEncryptionKey,
    webhookMaxAgeSeconds: readIntegerEnv("WEBHOOK_MAX_AGE_SECONDS", env, 300),
    appleHealthUploadSharedSecret: readOptionalEnv("APPLE_HEALTH_UPLOAD_SHARED_SECRET", env),
    strava: readProviderScope("STRAVA", env),
    whoop: readProviderScope("WHOOP", env),
  };
}

