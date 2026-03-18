import { Hono } from "hono";

import { errorResponse, okResponse } from "../lib/http";
import {
  resolveStravaWebhookChallenge,
  verifyWebhookSignature,
  verifyWebhookTimestamp,
} from "../lib/security";
import type { AppBindings } from "../types";

export const integrationsRouter = new Hono<AppBindings>();

integrationsRouter.post("/integrations/strava/connect", (c) =>
  errorResponse(c, {
    status: 501,
    code: "not_implemented",
    message: "Strava connect URL generation will land in Phase 2.",
  }),
);

integrationsRouter.get("/integrations/strava/callback", (c) =>
  errorResponse(c, {
    status: 501,
    code: "not_implemented",
    message: "Strava OAuth callback handling will land in Phase 2.",
  }),
);

integrationsRouter.post("/integrations/whoop/connect", (c) =>
  errorResponse(c, {
    status: 501,
    code: "not_implemented",
    message: "WHOOP connect URL generation is schema-ready but not live yet.",
  }),
);

integrationsRouter.get("/integrations/whoop/callback", (c) =>
  errorResponse(c, {
    status: 501,
    code: "not_implemented",
    message: "WHOOP OAuth callback handling will land after the core provider stack is stable.",
  }),
);

integrationsRouter.get("/webhooks/strava", (c) => {
  const challenge = resolveStravaWebhookChallenge({
    challenge: c.req.query("hub.challenge"),
    verifyToken: c.req.query("hub.verify_token"),
    expectedVerifyToken: c.get("env").strava.webhookVerifyToken,
  });

  if (!challenge) {
    return errorResponse(c, {
      status: 401,
      code: "invalid_webhook_challenge",
      message: "The Strava webhook challenge could not be verified.",
    });
  }

  return okResponse(c, {
    "hub.challenge": challenge,
  });
});

integrationsRouter.post("/webhooks/strava", async (c) => {
  const payload = await c.req.json().catch(() => null);

  return okResponse(
    c,
    {
      accepted: true,
      provider: "strava",
      note: "Webhook persistence and processing will be wired after the provider event table is connected to the runtime.",
      payloadPreview:
        c.get("env").nodeEnv === "development" && payload
          ? {
              object_id: payload.object_id ?? null,
              aspect_type: payload.aspect_type ?? null,
              object_type: payload.object_type ?? null,
            }
          : undefined,
    },
    202,
  );
});

integrationsRouter.post("/webhooks/whoop", async (c) => {
  const rawBody = await c.req.text();
  const timestampResult = verifyWebhookTimestamp({
    timestamp: c.req.header("x-whoop-signature-timestamp"),
    maxAgeSeconds: c.get("env").webhookMaxAgeSeconds,
  });

  if (!timestampResult.ok) {
    return errorResponse(c, {
      status: 401,
      code: timestampResult.reason,
      message: timestampResult.detail ?? "WHOOP webhook timestamp verification failed.",
    });
  }

  const signatureResult = verifyWebhookSignature({
    body: rawBody,
    secret: c.get("env").whoop.webhookSecret,
    providedSignature: c.req.header("x-whoop-signature"),
    provider: "whoop",
  });

  if (!signatureResult.ok) {
    return errorResponse(c, {
      status: 401,
      code: signatureResult.reason,
      message: signatureResult.detail ?? "WHOOP webhook signature verification failed.",
    });
  }

  return okResponse(
    c,
    {
      accepted: true,
      provider: "whoop",
      note: "WHOOP webhook persistence and background processing are scaffolded but not live yet.",
    },
    202,
  );
});
