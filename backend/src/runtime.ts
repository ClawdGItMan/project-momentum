import type { PgBoss } from "pg-boss";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Logger } from "pino";

import { createApp } from "./app";
import { loadBackendEnv, type BackendEnv } from "./config/env";
import { createLogger } from "./lib/logger";
import { createQueue } from "./lib/queue";
import { createSupabaseAdminClient } from "./lib/supabase/client";

export interface BackendRuntime {
  app: ReturnType<typeof createApp>;
  env: BackendEnv;
  logger: Logger;
  queue: PgBoss;
  supabaseAdmin: SupabaseClient;
}

export function createRuntime(env = loadBackendEnv()): BackendRuntime {
  const logger = createLogger(env.logLevel);
  const queue = createQueue(env);
  const supabaseAdmin = createSupabaseAdminClient(env);
  const app = createApp({
    env,
    logger,
    queue,
    supabaseAdmin,
  });

  return {
    app,
    env,
    logger,
    queue,
    supabaseAdmin,
  };
}
