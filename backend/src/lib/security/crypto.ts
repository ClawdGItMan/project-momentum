import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import type { EncryptionKeyMaterial, SealedSecretEnvelope } from "./types";

const AES_GCM_ALGORITHM = "aes-256-gcm";

function normalizeKeyBytes(base64Key: string): Uint8Array {
  const trimmed = base64Key.trim();
  const bytes = Buffer.from(trimmed, "base64");
  if (bytes.length !== 32) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes for AES-256-GCM; received ${bytes.length} bytes.`,
    );
  }

  const roundTrip = bytes.toString("base64").replace(/=+$/u, "");
  const expected = trimmed.replace(/\s+/gu, "").replace(/=+$/u, "");
  if (roundTrip !== expected) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY_BASE64 is not valid base64 or contains extra whitespace.",
    );
  }

  return bytes;
}

export function createEncryptionKeyMaterial(
  base64Key: string,
  keyId = "current",
): EncryptionKeyMaterial {
  return {
    algorithm: AES_GCM_ALGORITHM,
    keyId,
    bytes: normalizeKeyBytes(base64Key),
  };
}

export function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  if (leftBytes.length !== rightBytes.length) return false;
  return timingSafeEqual(leftBytes, rightBytes);
}

export function hashSecretFingerprint(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 32);
}

function toBuffer(value: string | Uint8Array): Buffer {
  return Buffer.isBuffer(value) ? value : Buffer.from(value);
}

export function sealSecret(input: {
  value: string | Uint8Array;
  key: EncryptionKeyMaterial;
  aad?: string;
}): SealedSecretEnvelope {
  const iv = randomBytes(12);
  const cipher = createCipheriv(AES_GCM_ALGORITHM, input.key.bytes, iv);
  if (input.aad) {
    cipher.setAAD(Buffer.from(input.aad, "utf8"));
  }

  const ciphertext = Buffer.concat([
    cipher.update(toBuffer(input.value)),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    version: 1,
    algorithm: AES_GCM_ALGORITHM,
    keyId: input.key.keyId,
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    authTag: authTag.toString("base64"),
    ...(input.aad ? { aad: input.aad } : {}),
  };
}

export function openSecret(
  envelope: SealedSecretEnvelope,
  key: EncryptionKeyMaterial,
  aad?: string,
): string {
  if (envelope.algorithm !== AES_GCM_ALGORITHM) {
    throw new Error(`Unsupported secret envelope algorithm: ${envelope.algorithm}`);
  }

  if (envelope.keyId !== key.keyId) {
    throw new Error(
      `Secret envelope was sealed with keyId "${envelope.keyId}" but keyId "${key.keyId}" was supplied.`,
    );
  }

  const decipher = createDecipheriv(
    AES_GCM_ALGORITHM,
    key.bytes,
    Buffer.from(envelope.iv, "base64"),
  );
  const effectiveAad = aad ?? envelope.aad;
  if (effectiveAad) {
    decipher.setAAD(Buffer.from(effectiveAad, "utf8"));
  }
  decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64")),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

