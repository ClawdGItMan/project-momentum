import { createHmac } from "node:crypto";

import type {
  ProviderName,
  WebhookVerificationFailure,
  WebhookVerificationResult,
} from "./types";
import { constantTimeEqual } from "./crypto";

function failure(
  reason: WebhookVerificationFailure["reason"],
  detail?: string,
): WebhookVerificationFailure {
  return { ok: false, reason, ...(detail ? { detail } : {}) };
}

function toBuffer(body: string | Uint8Array): Buffer {
  return Buffer.isBuffer(body) ? body : Buffer.from(body);
}

export function verifyWebhookSignature(input: {
  body: string | Uint8Array;
  secret?: string | null;
  providedSignature?: string | null;
  algorithm?: "sha256" | "sha1" | "sha512";
  signatureEncoding?: "hex" | "base64";
  signaturePrefix?: string;
  provider?: ProviderName;
}): WebhookVerificationResult {
  if (!input.secret) {
    return failure("missing_secret", "Webhook secret is not configured.");
  }
  if (!input.providedSignature) {
    return failure("missing_signature", "The provider did not send a webhook signature.");
  }

  const signatureEncoding = input.signatureEncoding ?? "hex";
  const signaturePrefix = input.signaturePrefix ?? "";
  const expectedSignature = `${signaturePrefix}${createHmac(
    input.algorithm ?? "sha256",
    input.secret,
  )
    .update(toBuffer(input.body))
    .digest(signatureEncoding)}`;

  if (!constantTimeEqual(input.providedSignature.trim(), expectedSignature)) {
    return failure("signature_mismatch", "The webhook signature did not verify.");
  }

  return { ok: true, ...(input.provider ? { provider: input.provider } : {}) };
}

export function verifyWebhookTimestamp(input: {
  timestamp?: string | number | null;
  now?: Date;
  maxAgeSeconds?: number;
}): WebhookVerificationResult {
  if (input.timestamp == null || input.timestamp === "") {
    return failure("missing_timestamp", "The webhook timestamp header was not provided.");
  }

  const parsed =
    typeof input.timestamp === "number"
      ? input.timestamp
      : Number.parseInt(String(input.timestamp), 10);

  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return failure("invalid_timestamp", "The webhook timestamp could not be parsed.");
  }

  const nowMs = (input.now ?? new Date()).getTime();
  const skewMs = Math.abs(nowMs - parsed * 1000);
  const maxAgeMs = (input.maxAgeSeconds ?? 300) * 1000;
  if (skewMs > maxAgeMs) {
    return failure("stale_timestamp", "The webhook timestamp is outside the allowed clock skew.");
  }

  return { ok: true };
}

export function resolveStravaWebhookChallenge(input: {
  challenge?: string | null;
  verifyToken?: string | null;
  expectedVerifyToken?: string | null;
}): string | null {
  if (!input.challenge || !input.verifyToken || !input.expectedVerifyToken) {
    return null;
  }

  if (!constantTimeEqual(input.verifyToken.trim(), input.expectedVerifyToken.trim())) {
    return null;
  }

  return input.challenge;
}
