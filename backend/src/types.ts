import type { PgBoss } from "pg-boss";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Logger } from "pino";

import type { BackendEnv } from "./config/env";

export interface AppBindings {
  Variables: {
    env: BackendEnv;
    logger: Logger;
    requestId: string;
    queue: PgBoss;
    supabaseAdmin: SupabaseClient;
    userId?: string;
  };
}
