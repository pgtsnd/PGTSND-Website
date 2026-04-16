import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_HEX_LENGTH = 32;
const IV_HEX_LENGTH = 32;
const SALT = "pgtsnd-vault-v1";
const HEX = /^[0-9a-f]+$/i;

export function deriveKey(masterKey: string): Buffer {
  if (!masterKey) {
    throw new Error("master key is required");
  }
  return scryptSync(masterKey, SALT, 32);
}

function getKey(): Buffer {
  const masterKey = process.env.VAULT_MASTER_KEY;
  if (!masterKey) {
    throw new Error("VAULT_MASTER_KEY environment variable is required");
  }
  return deriveKey(masterKey);
}

export function encryptWithKey(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
}

export function decryptWithKey(ciphertext: string, key: Buffer): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format");
  }
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function encrypt(plaintext: string): string {
  return encryptWithKey(plaintext, getKey());
}

export function decrypt(ciphertext: string): string {
  return decryptWithKey(ciphertext, getKey());
}

export function isEncryptedValue(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const parts = value.split(":");
  if (parts.length !== 3) return false;
  const [iv, tag, ct] = parts;
  if (iv.length !== IV_HEX_LENGTH || tag.length !== AUTH_TAG_HEX_LENGTH) return false;
  if (ct.length === 0 || ct.length % 2 !== 0) return false;
  return HEX.test(iv) && HEX.test(tag) && HEX.test(ct);
}

export function encryptConfig(config: Record<string, string>): Record<string, string> {
  const encrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(config)) {
    if (value && typeof value === "string" && value.length > 0) {
      encrypted[key] = encrypt(value);
    }
  }
  return encrypted;
}

export function decryptConfig(config: Record<string, string>): Record<string, string> {
  const decrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(config)) {
    try {
      decrypted[key] = decrypt(value);
    } catch {
      decrypted[key] = value;
    }
  }
  return decrypted;
}

export function maskValue(value: string): string {
  if (value.length <= 6) return "••••••";
  return value.slice(0, 4) + "••••" + value.slice(-4);
}

export function maskConfig(config: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(config)) {
    try {
      const plain = decrypt(value);
      masked[key] = maskValue(plain);
    } catch {
      if (value.length > 8) {
        masked[key] = maskValue(value);
      } else {
        masked[key] = value;
      }
    }
  }
  return masked;
}

export function isVaultReady(): boolean {
  return !!process.env.VAULT_MASTER_KEY;
}
