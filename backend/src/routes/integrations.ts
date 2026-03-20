import { createHash } from "node:crypto";

import { Hono, type Context } from "hono";

import { requireAuthenticatedUser } from "../lib/auth";
import { errorResponse, okResponse } from "../lib/http";
import {
  resolveStravaWebhookChallenge,
  verifyWebhookSignature,
  verifyWebhookTimestamp,
} from "../lib/security";
import {
  consumeProviderOAuthState,
  createProviderOAuthState,
  createProviderSyncRun,
  createStoredProviderToken,
  getProviderConnection,
  insertOrLoadProviderWebhookEvent,
  markProviderWebhookEventStatus,
  upsertProviderConnection,
} from "../lib/providers/store";
import { buildMobileCallbackRedirect, fingerprintOAuthStateToken, generateOAuthStateToken, getProviderCallbackUrl } from "../lib/providers/oauth";
import { disconnectManagedProvider, enqueueProviderSync, enqueueProviderWebhookProcessing } from "../lib/providers/sync";
import type { ManagedProvider, ProviderQueueRuntime, ProviderSyncJobPayload } from "../lib/providers/types";
import { exchangeStravaAuthorizationCode, getStravaAuthorizationUrl, isStravaConfigured } from "../lib/providers/strava";
import { exchangeWhoopAuthorizationCode, getWhoopAuthorizationUrl, isWhoopConfigured } from "../lib/providers/whoop";
import type { AppBindings } from "../types";

export const integrationsRouter = new Hono<AppBindings>();

function getProviderRuntime(c: Context<AppBindings>): ProviderQueueRuntime {
  return {
    env: c.get("env"),
    logger: c.get("logger"),
    queue: c.get("queue"),
    supabaseAdmin: c.get("supabaseAdmin"),
  };
}

function isProviderConfigured(runtime: ProviderQueueRuntime, provider: ManagedProvider): boolean {
  return provider === "strava"
    ? isStravaConfigured(runtime.env)
    : isWhoopConfigured(runtime.env);
}

function providerNotConfiguredResponse(
  c: Context<AppBindings>,
  provider: ManagedProvider,
) {
  return errorResponse(c, {
    status: 503,
    code: "provider_not_configured",
    message: `${provider} credentials are not configured on this backend.`,
  });
}

async function createProviderConnectResponse(
  c: Context<AppBindings>,
  provider: ManagedProvider,
): Promise<Response> {
  const auth = await requireAuthenticatedUser(c);
  if (auth.response) return auth.response;

  const runtime = getProviderRuntime(c);
  if (!isProviderConfigured(runtime, provider)) {
    return providerNotConfiguredResponse(c, provider);
  }

  let redirectUri: string;

  try {
    redirectUri = getProviderCallbackUrl(runtime.env, provider);
  } catch (error) {
    return errorResponse(c, {
      status: 500,
      code: "provider_callback_unavailable",
      message: error instanceof Error ? error.message : "Provider callback URL is unavailable.",
    });
  }

  const state = generateOAuthStateToken();
  await createProviderOAuthState(runtime.supabaseAdmin, {
    provider,
    userId: auth.user.id,
    stateFingerprint: fingerprintOAuthStateToken(state),
    redirectUri,
    requestedScopes: provider === "strava" ? ["read", "activity:read_all"] : ["offline", "read:profile", "read:recovery", "read:sleep", "read:workout", "read:cycles"],
    metadata: {
      requestId: c.get("requestId"),
    },
  });

  const authorizationUrl =
    provider === "strava"
      ? getStravaAuthorizationUrl({
          env: runtime.env,
          state,
          redirectUri,
        })
      : getWhoopAuthorizationUrl({
          env: runtime.env,
          state,
          redirectUri,
        });

  return okResponse(c, {
    provider,
    authorizationUrl,
    redirectUri,
    stateExpiresInSeconds: 900,
  });
}

async function createProviderSyncResponse(
  c: Context<AppBindings>,
  provider: ManagedProvider,
): Promise<Response> {
  const auth = await requireAuthenticatedUser(c);
  if (auth.response) return auth.response;

  const runtime = getProviderRuntime(c);
  if (!isProviderConfigured(runtime, provider)) {
    return providerNotConfiguredResponse(c, provider);
  }

  const connection = await getProviderConnection(runtime.supabaseAdmin, auth.user.id, provider);
  if (!connection) {
    return errorResponse(c, {
      status: 409,
      code: "provider_not_connected",
      message: `${provider} is not connected for the current user.`,
    });
  }

  const syncRun = await createProviderSyncRun(runtime.supabaseAdmin, {
    userId: auth.user.id,
    provider,
    metadata: {
      trigger: "manual",
      requestId: c.get("requestId"),
    },
  });

  await upsertProviderConnection(runtime.supabaseAdmin, {
    userId: auth.user.id,
    provider,
    state: "syncing",
    connectedAt: connection.connected_at ?? new Date().toISOString(),
    lastError: null,
  });

  await enqueueProviderSync(runtime, {
    provider,
    userId: auth.user.id,
    syncRunId: syncRun.id,
    mode: "manual",
    reason: "manual_sync",
  } satisfies ProviderSyncJobPayload);

  return okResponse(
    c,
    {
      provider,
      queued: true,
      syncRunId: syncRun.id,
    },
    202,
  );
}

async function createProviderDisconnectResponse(
  c: Context<AppBindings>,
  provider: ManagedProvider,
): Promise<Response> {
  const auth = await requireAuthenticatedUser(c);
  if (auth.response) return auth.response;

  const runtime = getProviderRuntime(c);
  const connection = await getProviderConnection(runtime.supabaseAdmin, auth.user.id, provider);

  if (!connection) {
    return okResponse(c, {
      provider,
      disconnected: true,
    });
  }

  await disconnectManagedProvider(runtime, connection);

  return okResponse(c, {
    provider,
    disconnected: true,
  });
}

function buildCallbackErrorRedirect(provider: ManagedProvider, reason: string): Response {
  return Response.redirect(buildMobileCallbackRedirect(provider, {
    status: "error",
    reason,
  }), 302);
}

function parseWebhookPayload(
  c: Context<AppBindings>,
  rawBody: string,
): Record<string, unknown> | Response {
  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return errorResponse(c, {
      status: 400,
      code: "invalid_webhook_payload",
      message: "The webhook body could not be parsed as JSON.",
    });
  }
}

async function handleProviderCallback(
  c: Context<AppBindings>,
  provider: ManagedProvider,
): Promise<Response> {
  const runtime = getProviderRuntime(c);
  if (!isProviderConfigured(runtime, provider)) {
    return buildCallbackErrorRedirect(provider, "provider_not_configured");
  }

  const state = c.req.query("state");
  const code = c.req.query("code");
  const providerError = c.req.query("error");

  if (providerError) {
    return buildCallbackErrorRedirect(provider, providerError);
  }

  if (!state || !code) {
    return buildCallbackErrorRedirect(provider, "missing_code_or_state");
  }

  let oauthState;
  try {
    oauthState = await consumeProviderOAuthState(runtime.supabaseAdmin, {
      provider,
      stateFingerprint: fingerprintOAuthStateToken(state),
    });
  } catch (error) {
    runtime.logger.error(
      {
        provider,
        requestId: c.get("requestId"),
        error: error instanceof Error ? error.message : "unknown error",
      },
      "Provider OAuth state lookup failed.",
    );
    return buildCallbackErrorRedirect(provider, "oauth_state_lookup_failed");
  }

  if (!oauthState) {
    return buildCallbackErrorRedirect(provider, "invalid_or_expired_state");
  }

  try {
    const connectedAccount =
      provider === "strava"
        ? await exchangeStravaAuthorizationCode({
            env: runtime.env,
            code,
            redirectUri: oauthState.redirect_uri,
          })
        : await exchangeWhoopAuthorizationCode({
            env: runtime.env,
            code,
            redirectUri: oauthState.redirect_uri,
          });

    const connection = await upsertProviderConnection(runtime.supabaseAdmin, {
      userId: oauthState.user_id,
      provider,
      state: "syncing",
      connectedAt: new Date().toISOString(),
      lastError: null,
      providerAccountId: connectedAccount.providerAccountId || null,
      providerUsername: connectedAccount.providerUsername ?? null,
      scopes: connectedAccount.scopes,
      accessToken: createStoredProviderToken({
        env: runtime.env,
        provider,
        kind: "access",
        value: connectedAccount.accessToken,
        userId: oauthState.user_id,
      }),
      refreshToken: connectedAccount.refreshToken
        ? createStoredProviderToken({
            env: runtime.env,
            provider,
            kind: "refresh",
            value: connectedAccount.refreshToken,
            userId: oauthState.user_id,
          })
        : null,
      tokenExpiresAt: connectedAccount.tokenExpiresAt,
      metadata: {
        oauthConnectedAt: new Date().toISOString(),
        ...(connectedAccount.metadata ?? {}),
      },
    });

    const syncRun = await createProviderSyncRun(runtime.supabaseAdmin, {
      userId: oauthState.user_id,
      provider,
      metadata: {
        trigger: "oauth_callback",
        requestId: c.get("requestId"),
      },
    });

    await enqueueProviderSync(runtime, {
      provider,
      userId: oauthState.user_id,
      syncRunId: syncRun.id,
      mode: "manual",
      reason: "oauth_callback",
    });

    runtime.logger.info(
      {
        provider,
        requestId: c.get("requestId"),
        userId: oauthState.user_id,
        providerConnectionId: connection.id,
        syncRunId: syncRun.id,
      },
      "Provider OAuth callback completed and sync queued.",
    );

    return c.redirect(
      buildMobileCallbackRedirect(provider, {
        status: "connected",
        syncRunId: syncRun.id,
      }),
      302,
    );
  } catch (error) {
    runtime.logger.error(
      {
        provider,
        requestId: c.get("requestId"),
        userId: oauthState.user_id,
        error: error instanceof Error ? error.message : "unknown error",
      },
      "Provider OAuth callback failed.",
    );

    await upsertProviderConnection(runtime.supabaseAdmin, {
      userId: oauthState.user_id,
      provider,
      state: "error",
      lastError: error instanceof Error ? error.message : "Provider callback failed.",
      metadata: {
        lastOAuthFailureAt: new Date().toISOString(),
      },
    }).catch(() => undefined);

    return buildCallbackErrorRedirect(provider, "oauth_callback_failed");
  }
}

function createEventHash(rawBody: string): string {
  return createHash("sha256").update(rawBody, "utf8").digest("hex");
}

integrationsRouter.post("/integrations/strava/connect", (c) =>
  createProviderConnectResponse(c, "strava"),
);

integrationsRouter.get("/integrations/strava/callback", (c) =>
  handleProviderCallback(c, "strava"),
);

integrationsRouter.post("/integrations/strava/sync", (c) =>
  createProviderSyncResponse(c, "strava"),
);

integrationsRouter.delete("/integrations/strava", (c) =>
  createProviderDisconnectResponse(c, "strava"),
);

integrationsRouter.post("/integrations/whoop/connect", (c) =>
  createProviderConnectResponse(c, "whoop"),
);

integrationsRouter.get("/integrations/whoop/callback", (c) =>
  handleProviderCallback(c, "whoop"),
);

integrationsRouter.post("/integrations/whoop/sync", (c) =>
  createProviderSyncResponse(c, "whoop"),
);

integrationsRouter.delete("/integrations/whoop", (c) =>
  createProviderDisconnectResponse(c, "whoop"),
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
  const runtime = getProviderRuntime(c);
  const rawBody = await c.req.text();
  const parsedPayload = parseWebhookPayload(c, rawBody);
  if (parsedPayload instanceof Response) {
    return parsedPayload;
  }
  const payload = parsedPayload;

  const externalEventId = [
    payload.object_type,
    payload.object_id,
    payload.aspect_type,
    payload.event_time,
  ]
    .filter(Boolean)
    .join(":");

  const event = await insertOrLoadProviderWebhookEvent(runtime.supabaseAdmin, {
    provider: "strava",
    externalEventId: externalEventId || null,
    eventType:
      [payload.object_type, payload.aspect_type].filter(Boolean).join(".") ||
      "unknown",
    payload,
    signatureVerified: true,
    eventHash: createEventHash(rawBody),
  });

  await enqueueProviderWebhookProcessing(runtime, {
    provider: "strava",
    webhookEventId: event.id,
  });

  await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
    webhookEventId: event.id,
    status: "queued",
  });

  return okResponse(
    c,
    {
      accepted: true,
      provider: "strava",
      webhookEventId: event.id,
      eventType: event.event_type,
    },
    202,
  );
});

integrationsRouter.post("/webhooks/whoop", async (c) => {
  const runtime = getProviderRuntime(c);
  const rawBody = await c.req.text();
  const timestamp = c.req.header("x-whoop-signature-timestamp");
  const timestampResult = verifyWebhookTimestamp({
    timestamp,
    maxAgeSeconds: runtime.env.webhookMaxAgeSeconds,
  });

  if (!timestampResult.ok) {
    return errorResponse(c, {
      status: 401,
      code: timestampResult.reason,
      message: timestampResult.detail ?? "WHOOP webhook timestamp verification failed.",
    });
  }

  const signatureResult = verifyWebhookSignature({
    body: `${timestamp ?? ""}${rawBody}`,
    secret: runtime.env.whoop.webhookSecret,
    providedSignature: c.req.header("x-whoop-signature"),
    provider: "whoop",
    signatureEncoding: "base64",
  });

  if (!signatureResult.ok) {
    return errorResponse(c, {
      status: 401,
      code: signatureResult.reason,
      message: signatureResult.detail ?? "WHOOP webhook signature verification failed.",
    });
  }

  const parsedPayload = parseWebhookPayload(c, rawBody);
  if (parsedPayload instanceof Response) {
    return parsedPayload;
  }
  const payload = parsedPayload;

  const event = await insertOrLoadProviderWebhookEvent(runtime.supabaseAdmin, {
    provider: "whoop",
    externalEventId:
      typeof payload.trace_id === "string" ? payload.trace_id : null,
    eventType: String(payload.type ?? "unknown"),
    payload,
    signatureVerified: true,
    eventHash: createEventHash(rawBody),
  });

  await enqueueProviderWebhookProcessing(runtime, {
    provider: "whoop",
    webhookEventId: event.id,
  });

  await markProviderWebhookEventStatus(runtime.supabaseAdmin, {
    webhookEventId: event.id,
    status: "queued",
  });

  return okResponse(
    c,
    {
      accepted: true,
      provider: "whoop",
      webhookEventId: event.id,
      eventType: event.event_type,
    },
    202,
  );
});
