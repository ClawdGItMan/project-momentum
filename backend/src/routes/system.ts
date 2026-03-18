import { Hono } from "hono";

import { okResponse } from "../lib/http";
import type { AppBindings } from "../types";

export const systemRouter = new Hono<AppBindings>();

systemRouter.get("/health", (c) =>
  okResponse(c, {
    status: "ok",
    service: "project-momentum-backend",
    time: new Date().toISOString(),
  }),
);

systemRouter.get("/ready", (c) =>
  okResponse(c, {
    status: "ready",
    queueSchema: c.get("env").queueSchema,
    supabaseUrl: c.get("env").supabaseUrl,
    time: new Date().toISOString(),
  }),
);
