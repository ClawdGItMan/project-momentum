import type { PgBoss } from "pg-boss";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Logger } from "pino";
import { Hono } from "hono";
import { cors } from "hono/cors";

import type { BackendEnv } from "./config/env";
import { errorResponse } from "./lib/http";
import { authRouter } from "./routes/auth";
import { integrationsRouter } from "./routes/integrations";
import { meRouter } from "./routes/me";
import { systemRouter } from "./routes/system";
import type { AppBindings } from "./types";

export function createApp(input: {
  env: BackendEnv;
  logger: Logger;
  queue: PgBoss;
  supabaseAdmin: SupabaseClient;
}) {
  const app = new Hono<AppBindings>();

  app.use("*", async (c, next) => {
    const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
    c.set("env", input.env);
    c.set("logger", input.logger);
    c.set("queue", input.queue);
    c.set("supabaseAdmin", input.supabaseAdmin);
    c.set("requestId", requestId);
    c.header("x-request-id", requestId);
    await next();
  });

  app.use(
    "*",
    cors({
      origin: input.env.corsOrigin ?? "*",
      allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
      allowHeaders: ["authorization", "content-type", "x-request-id"],
    }),
  );

  app.route("/", systemRouter);
  app.route("/", authRouter);
  app.route("/", meRouter);
  app.route("/", integrationsRouter);

  app.notFound((c) =>
    errorResponse(c, {
      status: 404,
      code: "not_found",
      message: "Route not found.",
    }),
  );

  app.onError((error, c) => {
    c.get("logger").error(
      {
        err: error,
        requestId: c.get("requestId"),
        path: c.req.path,
        method: c.req.method,
      },
      "Unhandled backend request error.",
    );

    return errorResponse(c, {
      status: 500,
      code: "internal_error",
      message: "An unexpected backend error occurred.",
    });
  });

  return app;
}
