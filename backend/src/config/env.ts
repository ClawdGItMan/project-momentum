import "dotenv/config";

import {
  loadBackendSecurityEnv,
  readEnumEnv,
  readIntegerEnv,
  readOptionalEnv,
  type BackendSecurityEnv,
} from "../lib/security";

export type BackendLogLevel =
  | "fatal"
  | "error"
  | "warn"
  | "info"
  | "debug"
  | "trace";

export interface BackendEnv extends BackendSecurityEnv {
  port: number;
  logLevel: BackendLogLevel;
  queueSchema: string;
}

export function loadBackendEnv(
  env: Record<string, string | undefined> = process.env,
): BackendEnv {
  const security = loadBackendSecurityEnv(env);

  return {
    ...security,
    port: readIntegerEnv("PORT", env, 8787),
    logLevel: readEnumEnv<BackendLogLevel>(
      "LOG_LEVEL",
      ["fatal", "error", "warn", "info", "debug", "trace"],
      {
        ...env,
        LOG_LEVEL: readOptionalEnv("LOG_LEVEL", env) ?? "info",
      },
    ),
    queueSchema: readOptionalEnv("QUEUE_SCHEMA", env) ?? "job_queue",
  };
}
