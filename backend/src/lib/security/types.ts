export type BackendNodeEnv = "development" | "test" | "production";

export type ProviderName = "apple-health" | "strava" | "whoop";

export type TokenKind = "access" | "refresh" | "shared-secret";

export type WebhookSignatureEncoding = "hex" | "base64";

export type WebhookVerificationReason =
  | "missing_signature"
  | "signature_mismatch"
  | "missing_challenge"
  | "challenge_mismatch"
  | "missing_timestamp"
  | "stale_timestamp"
  | "invalid_timestamp"
  | "missing_secret";

export interface EncryptionKeyMaterial {
  algorithm: "aes-256-gcm";
  keyId: string;
  bytes: Uint8Array;
}

export interface SealedSecretEnvelope {
  version: 1;
  algorithm: "aes-256-gcm";
  keyId: string;
  iv: string;
  ciphertext: string;
  authTag: string;
  aad?: string;
}

export interface ProviderTokenVaultRecord {
  provider: ProviderName;
  kind: TokenKind;
  keyId: string;
  fingerprint: string;
  encrypted: SealedSecretEnvelope;
  createdAt: string;
  rotatedAt?: string;
  revokedAt?: string;
}

export interface ProviderScopeConfig {
  clientId?: string;
  clientSecret?: string;
  webhookVerifyToken?: string;
  webhookSecret?: string;
}

export interface BackendSecurityEnv {
  nodeEnv: BackendNodeEnv;
  backendPublicUrl?: string;
  corsOrigin?: string;
  databaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  sessionSecret: string;
  tokenEncryptionKey: EncryptionKeyMaterial;
  webhookMaxAgeSeconds: number;
  appleHealthUploadSharedSecret?: string;
  strava: ProviderScopeConfig;
  whoop: ProviderScopeConfig;
}

export interface WebhookVerificationFailure {
  ok: false;
  reason: WebhookVerificationReason;
  detail?: string;
}

export interface WebhookVerificationSuccess {
  ok: true;
  provider?: ProviderName;
}

export type WebhookVerificationResult =
  | WebhookVerificationSuccess
  | WebhookVerificationFailure;

