import type { EncryptionKeyMaterial, ProviderName, ProviderTokenVaultRecord } from "./types";
import { hashSecretFingerprint, openSecret, sealSecret } from "./crypto";

export function fingerprintToken(value: string): string {
  return hashSecretFingerprint(value);
}

export function sealProviderToken(input: {
  provider: ProviderName;
  kind: ProviderTokenVaultRecord["kind"];
  value: string;
  key: EncryptionKeyMaterial;
  createdAt?: string;
  aad?: string;
}): ProviderTokenVaultRecord {
  return {
    provider: input.provider,
    kind: input.kind,
    keyId: input.key.keyId,
    fingerprint: fingerprintToken(input.value),
    encrypted: sealSecret({
      value: input.value,
      key: input.key,
      aad: input.aad ?? `${input.provider}:${input.kind}`,
    }),
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function openProviderToken(
  record: ProviderTokenVaultRecord,
  keyLookup: EncryptionKeyMaterial | ((keyId: string) => EncryptionKeyMaterial | null),
  aad?: string,
): string {
  const key =
    typeof keyLookup === "function"
      ? keyLookup(record.keyId)
      : keyLookup.keyId === record.keyId
        ? keyLookup
        : null;

  if (!key) {
    throw new Error(`No encryption key available for provider token keyId "${record.keyId}".`);
  }

  return openSecret(record.encrypted, key, aad ?? `${record.provider}:${record.kind}`);
}

