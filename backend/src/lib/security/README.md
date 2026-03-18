# Backend Security

This directory holds the first-pass security contract for the backend phase of Project Momentum.

## Trust Boundary

- Apple Health stays device-first.
- The mobile app reads HealthKit locally and uploads only explicit, user-approved summaries or check-in payloads.
- Strava and WHOOP are server-managed providers.
- Their OAuth secrets, refresh tokens, webhook verification, and sync jobs belong on the backend only.
- No client storage should ever contain provider secrets or long-lived backend credentials.

## Environment Contract

The backend phase expects a small, explicit env surface:

- `DATABASE_URL` for Postgres and `pg-boss`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET` for session signing or cookie encryption
- `TOKEN_ENCRYPTION_KEY_BASE64` for AES-256-GCM secret sealing
- `TOKEN_ENCRYPTION_KEY_ID` for future key rotation
- `BACKEND_PUBLIC_URL` and `CORS_ORIGIN` when the API is exposed outside local dev
- `WEBHOOK_MAX_AGE_SECONDS` to bound replay tolerance
- provider-specific keys for `STRAVA_*`, `WHOOP_*`, and Apple Health upload gating if those flows are enabled

See the root [.env.example](/Users/me/Projects/Lifestyle%20App/.env.example) for the concrete placeholder list.

## Security Rules

- Fail closed on missing secrets or malformed webhook data.
- Never parse or trust a webhook body before verifying the signature against the raw bytes.
- Keep access tokens short-lived and refresh tokens encrypted at rest.
- Prefer storing only a token fingerprint alongside the sealed value so lookups never depend on plaintext secrets.
- Do not log raw HealthKit payloads, OAuth tokens, or webhook bodies.
- Use constant-time comparisons for signatures and shared secrets.
- Keep Apple Health out of the backend persistence boundary unless the user explicitly publishes a normalized summary.

## Helpers

- `loadBackendSecurityEnv` validates the backend env contract.
- `createEncryptionKeyMaterial` and `sealSecret` implement AES-256-GCM secret sealing.
- `sealProviderToken` and `openProviderToken` wrap provider token custody.
- `verifyWebhookSignature` and `verifyWebhookTimestamp` provide reusable webhook guards.
- `resolveStravaWebhookChallenge` handles Strava's webhook challenge handshake.

## Usage Pattern

```ts
import {
  loadBackendSecurityEnv,
  resolveStravaWebhookChallenge,
  sealProviderToken,
  verifyWebhookSignature,
} from "./index";

const env = loadBackendSecurityEnv();

const signatureCheck = verifyWebhookSignature({
  body: rawBody,
  secret: env.whoop.webhookSecret,
  providedSignature: request.headers.get("x-whoop-signature"),
  provider: "whoop",
});

if (!signatureCheck.ok) {
  throw new Error(signatureCheck.reason);
}

const challenge = resolveStravaWebhookChallenge({
  challenge: query.challenge,
  verifyToken: query["hub.verify_token"],
  expectedVerifyToken: env.strava.webhookVerifyToken,
});

const sealed = sealProviderToken({
  provider: "strava",
  kind: "refresh",
  value: refreshToken,
  key: env.tokenEncryptionKey,
});
```

## Follow-Up Work

- Add request-context helpers for Hono once the backend service exists.
- Add a small adapter for rotating multiple encryption keys when the first rotation is needed.
- Confirm the final provider header names and signing strings against the live Strava and WHOOP SDKs before wiring the handlers.
