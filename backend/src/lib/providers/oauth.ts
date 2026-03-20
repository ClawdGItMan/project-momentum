import { randomBytes } from "node:crypto";

import type { BackendEnv } from "../../config/env";
import { fingerprintToken } from "../security";
import type { ManagedProvider } from "./types";

const STATE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOAuthStateToken(length = 8): string {
  const bytes = randomBytes(length);
  let token = "";

  for (let index = 0; index < length; index += 1) {
    token += STATE_ALPHABET[bytes[index]! % STATE_ALPHABET.length];
  }

  return token;
}

export function fingerprintOAuthStateToken(token: string): string {
  return fingerprintToken(token);
}

export function getProviderCallbackUrl(
  env: BackendEnv,
  provider: ManagedProvider,
): string {
  if (!env.backendPublicUrl) {
    throw new Error("BACKEND_PUBLIC_URL must be configured for provider OAuth callbacks.");
  }

  return `${env.backendPublicUrl}/integrations/${provider}/callback`;
}

export function buildMobileCallbackRedirect(
  provider: ManagedProvider,
  input: {
    status: "connected" | "error" | "queued" | "disconnected";
    reason?: string;
    syncRunId?: string;
  },
): string {
  const search = new URLSearchParams();
  search.set("status", input.status);

  if (input.reason) {
    search.set("reason", input.reason);
  }

  if (input.syncRunId) {
    search.set("syncRunId", input.syncRunId);
  }

  return `momentum://integrations/${provider}/callback?${search.toString()}`;
}
