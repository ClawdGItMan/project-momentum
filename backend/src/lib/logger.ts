import pino, { type Logger } from "pino";

import type { BackendLogLevel } from "../config/env";

export function createLogger(level: BackendLogLevel): Logger {
  return pino({
    level,
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "req.headers.authorization",
        "*.authorization",
        "*.token",
        "*.access_token",
        "*.refresh_token",
        "*.client_secret",
        "*.service_role_key",
        "*.supabaseServiceRoleKey",
      ],
      censor: "[REDACTED]",
    },
  });
}
