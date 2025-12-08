import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  // Key must be 32 bytes for AES-256
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt sensitive data
 * Returns base64 encoded string: iv:authTag:encryptedData
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  // Combine iv, authTag, and encrypted data
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 * Expects base64 encoded string: iv:authTag:encryptedData
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(parts[0], "base64");
  const authTag = Buffer.from(parts[1], "base64");
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Mask a bank account number for display
 * Shows only the last 4 digits
 */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) {
    return "****";
  }
  return "*".repeat(accountNumber.length - 4) + accountNumber.slice(-4);
}

/**
 * Check if a string is encrypted (has the expected format)
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  return parts.length === 3;
}
