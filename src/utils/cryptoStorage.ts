/**
 * Cryptographic Storage & Security Vault Utility for PediCal
 * 
 * Provides:
 * 1. Native Web Crypto API (AES-GCM 256-bit) encryption/decryption.
 * 2. Master Key Architecture: 256-bit random master key encrypts/decrypts clinical records in IndexedDB.
 * 3. Dual-Layer Wrappers: Master key is wrapped by PIN (PBKDF2-SHA256) AND a 32-character formatted Recovery Key.
 * 4. Recovery Flow: Forgotten PIN recovery via 32-char Recovery Key to unwrap Master Key and set a new PIN.
 * 5. Encrypted Backup: Export/import of JSON backups using AES-GCM and user-provided password.
 */

const VAULT_STORAGE_KEY = 'pedical_security_vault_v1';
const PBKDF2_ITERATIONS = 100000;
const TEST_TOKEN = 'PEDICAL_MASTER_KEY_VERIFIED_V1';

export interface EncryptedPayload {
  iv: string; // Base64 12-byte IV
  ciphertext: string; // Base64 ciphertext
}

export interface SecurityVaultRecord {
  version: 1;
  createdAt: string;
  pinSalt: string; // Base64 16 bytes
  pinIv: string; // Base64 12 bytes
  pinWrappedKey: string; // Base64 wrapped raw master key
  recoverySalt: string; // Base64 16 bytes
  recoveryIv: string; // Base64 12 bytes
  recoveryWrappedKey: string; // Base64 wrapped raw master key
  keyVerification: EncryptedPayload; // Encrypted TEST_TOKEN for fast verification
}

export interface EncryptedBackupFile {
  format: 'pedical-encrypted-backup-v1';
  version: '3.0';
  timestamp: string;
  facility: string;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  app: string;
}

// In-memory active Master Key session
let inMemoryMasterKey: CryptoKey | null = null;

// ==========================================
// Base64 & Buffer Conversion Utilities
// ==========================================

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ==========================================
// 32-Character Recovery Key Utilities
// ==========================================

const RECOVERY_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 characters, no ambiguous 0/O/1/I

/**
 * Generates a random 32-character recovery key formatted as 8 groups of 4 characters:
 * e.g., "ABCD-EFGH-JKLM-NPQR-STUV-WXYZ-2345-6789"
 */
export function generateRecoveryKey(): string {
  const randomBytes = new Uint8Array(32);
  window.crypto.getRandomValues(randomBytes);
  let raw = '';
  for (let i = 0; i < 32; i++) {
    raw += RECOVERY_CHARSET[randomBytes[i] % RECOVERY_CHARSET.length];
  }
  // Format into 8 groups of 4 with hyphens
  return raw.match(/.{1,4}/g)?.join('-') || raw;
}

/**
 * Normalizes user-input recovery key by stripping whitespace, hyphens, and converting to uppercase.
 */
export function normalizeRecoveryKey(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/**
 * Validates if the normalized string is a valid 32-character recovery key.
 */
export function isValidRecoveryKeyFormat(input: string): boolean {
  const normalized = normalizeRecoveryKey(input);
  return normalized.length === 32;
}

// ==========================================
// Key Derivation & Cryptographic Core
// ==========================================

/**
 * Derives a 256-bit AES-GCM wrapping key from a secret string (PIN or Recovery Key) using PBKDF2-SHA256.
 */
async function deriveWrappingKey(secret: string, salt: Uint8Array, iterations = PBKDF2_ITERATIONS): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt']
  );
}

/**
 * Generates a fresh 256-bit AES-GCM Master Encryption Key.
 */
export async function generateMasterKey(): Promise<CryptoKey> {
  return window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // Extractable for wrapping
    ['encrypt', 'decrypt', 'wrapKey']
  );
}

/**
 * Encrypts arbitrary JavaScript data into Base64 ciphertext with AES-GCM and a random 12-byte IV.
 */
export async function encryptObject<T>(key: CryptoKey, data: T): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  return {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext),
  };
}

/**
 * Decrypts Base64 ciphertext with AES-GCM back into a JavaScript object.
 */
export async function decryptObject<T>(key: CryptoKey, payload: EncryptedPayload): Promise<T> {
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted)) as T;
}

// ==========================================
// Dual-Layer Master Vault Management
// ==========================================

/**
 * Sets up a new Security Vault by wrapping a Master Key with BOTH a PIN and a 32-character Recovery Key.
 */
export async function initializeSecurityVault(
  pin: string,
  recoveryKey: string,
  existingMasterKey?: CryptoKey
): Promise<{ vault: SecurityVaultRecord; masterKey: CryptoKey }> {
  const masterKey = existingMasterKey || (await generateMasterKey());
  const cleanPin = pin.trim();
  const cleanRecoveryKey = normalizeRecoveryKey(recoveryKey);

  // 1. Wrap Master Key with PIN
  const pinSalt = window.crypto.getRandomValues(new Uint8Array(16));
  const pinIv = window.crypto.getRandomValues(new Uint8Array(12));
  const pinWrappingKey = await deriveWrappingKey(cleanPin, pinSalt);
  const pinWrapped = await window.crypto.subtle.wrapKey(
    'raw',
    masterKey,
    pinWrappingKey,
    { name: 'AES-GCM', iv: pinIv }
  );

  // 2. Wrap Master Key with 32-char Recovery Key
  const recoverySalt = window.crypto.getRandomValues(new Uint8Array(16));
  const recoveryIv = window.crypto.getRandomValues(new Uint8Array(12));
  const recoveryWrappingKey = await deriveWrappingKey(cleanRecoveryKey, recoverySalt);
  const recoveryWrapped = await window.crypto.subtle.wrapKey(
    'raw',
    masterKey,
    recoveryWrappingKey,
    { name: 'AES-GCM', iv: recoveryIv }
  );

  // 3. Encrypt verification token to quickly confirm unwrap validity
  const keyVerification = await encryptObject(masterKey, { token: TEST_TOKEN });

  const vault: SecurityVaultRecord = {
    version: 1,
    createdAt: new Date().toISOString(),
    pinSalt: bufferToBase64(pinSalt),
    pinIv: bufferToBase64(pinIv),
    pinWrappedKey: bufferToBase64(pinWrapped),
    recoverySalt: bufferToBase64(recoverySalt),
    recoveryIv: bufferToBase64(recoveryIv),
    recoveryWrappedKey: bufferToBase64(recoveryWrapped),
    keyVerification,
  };

  saveSecurityVault(vault);
  setActiveMasterKey(masterKey);

  return { vault, masterKey };
}

/**
 * Unwraps the Master Key using the user's PIN. Throws error if PIN is invalid.
 */
export async function unwrapMasterKeyWithPin(pin: string, vault: SecurityVaultRecord): Promise<CryptoKey> {
  const cleanPin = pin.trim();
  const pinSalt = base64ToBuffer(vault.pinSalt);
  const pinIv = base64ToBuffer(vault.pinIv);
  const pinWrappedBytes = base64ToBuffer(vault.pinWrappedKey);

  const pinWrappingKey = await deriveWrappingKey(cleanPin, pinSalt);

  try {
    const masterKey = await window.crypto.subtle.unwrapKey(
      'raw',
      pinWrappedBytes as unknown as BufferSource,
      pinWrappingKey,
      { name: 'AES-GCM', iv: pinIv as unknown as BufferSource },
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt', 'wrapKey']
    );

    // Verify verification token
    const test = await decryptObject<{ token: string }>(masterKey, vault.keyVerification);
    if (test.token !== TEST_TOKEN) {
      throw new Error('Key verification mismatch.');
    }

    setActiveMasterKey(masterKey);
    return masterKey;
  } catch (err) {
    throw new Error('Incorrect PIN. Cryptographic key unwrap failed.');
  }
}

/**
 * Unwraps the Master Key using the 32-character Recovery Key.
 */
export async function unwrapMasterKeyWithRecoveryKey(
  recoveryKey: string,
  vault: SecurityVaultRecord
): Promise<CryptoKey> {
  const cleanRecoveryKey = normalizeRecoveryKey(recoveryKey);
  const recoverySalt = base64ToBuffer(vault.recoverySalt);
  const recoveryIv = base64ToBuffer(vault.recoveryIv);
  const recoveryWrappedBytes = base64ToBuffer(vault.recoveryWrappedKey);

  const recoveryWrappingKey = await deriveWrappingKey(cleanRecoveryKey, recoverySalt);

  try {
    const masterKey = await window.crypto.subtle.unwrapKey(
      'raw',
      recoveryWrappedBytes as unknown as BufferSource,
      recoveryWrappingKey,
      { name: 'AES-GCM', iv: recoveryIv as unknown as BufferSource },
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt', 'wrapKey']
    );

    const test = await decryptObject<{ token: string }>(masterKey, vault.keyVerification);
    if (test.token !== TEST_TOKEN) {
      throw new Error('Key verification mismatch.');
    }

    setActiveMasterKey(masterKey);
    return masterKey;
  } catch (err) {
    throw new Error('Invalid Recovery Key. Cryptographic unwrap failed.');
  }
}

/**
 * Re-wraps the active Master Key with a new PIN (called after resetting PIN or changing PIN in settings).
 */
export async function updateVaultPin(newPin: string, masterKey: CryptoKey): Promise<SecurityVaultRecord> {
  const existingVault = loadSecurityVault();
  if (!existingVault) {
    throw new Error('No existing security vault found to update PIN.');
  }

  const cleanPin = newPin.trim();
  const pinSalt = window.crypto.getRandomValues(new Uint8Array(16));
  const pinIv = window.crypto.getRandomValues(new Uint8Array(12));
  const pinWrappingKey = await deriveWrappingKey(cleanPin, pinSalt);

  const pinWrapped = await window.crypto.subtle.wrapKey(
    'raw',
    masterKey,
    pinWrappingKey,
    { name: 'AES-GCM', iv: pinIv }
  );

  const updatedVault: SecurityVaultRecord = {
    ...existingVault,
    pinSalt: bufferToBase64(pinSalt),
    pinIv: bufferToBase64(pinIv),
    pinWrappedKey: bufferToBase64(pinWrapped),
  };

  saveSecurityVault(updatedVault);
  return updatedVault;
}

// ==========================================
// Vault Storage & Memory Session State
// ==========================================

export function saveSecurityVault(vault: SecurityVaultRecord): void {
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
  } catch (err) {
    console.warn('[PediCal Crypto] Could not persist vault to localStorage:', err);
  }
}

export function loadSecurityVault(): SecurityVaultRecord | null {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1 && parsed.pinWrappedKey && parsed.recoveryWrappedKey) {
        return parsed as SecurityVaultRecord;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function removeSecurityVault(): void {
  try {
    localStorage.removeItem(VAULT_STORAGE_KEY);
  } catch {
    // ignore
  }
  clearActiveMasterKey();
}

export function isVaultConfigured(): boolean {
  return loadSecurityVault() !== null;
}

export function setActiveMasterKey(key: CryptoKey | null): void {
  inMemoryMasterKey = key;
}

export function getActiveMasterKey(): CryptoKey | null {
  return inMemoryMasterKey;
}

export function clearActiveMasterKey(): void {
  inMemoryMasterKey = null;
}

// ==========================================
// Secure Encrypted JSON Backup Export / Import
// ==========================================

/**
 * Creates an encrypted JSON backup using AES-GCM and a user-provided passphrase.
 */
export async function createEncryptedBackup(
  backupData: any,
  passphrase: string,
  facilityName = 'PediCal Ward'
): Promise<string> {
  const cleanPass = passphrase.trim();
  if (!cleanPass) {
    throw new Error('A backup password is required to encrypt your data export.');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveWrappingKey(cleanPass, salt, PBKDF2_ITERATIONS);

  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(backupData));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  const filePayload: EncryptedBackupFile = {
    format: 'pedical-encrypted-backup-v1',
    version: '3.0',
    timestamp: new Date().toISOString(),
    facility: facilityName,
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext),
    app: 'PediCal Pediatric Clinical Decision Support Suite',
  };

  return JSON.stringify(filePayload, null, 2);
}

/**
 * Restores an encrypted JSON backup file using the user-provided passphrase.
 */
export async function restoreEncryptedBackup(
  jsonContent: string,
  passphrase: string
): Promise<any> {
  const cleanPass = passphrase.trim();
  const parsed = JSON.parse(jsonContent);

  if (parsed.format !== 'pedical-encrypted-backup-v1' || !parsed.ciphertext || !parsed.iv || !parsed.salt) {
    throw new Error('Invalid format: this file is not a valid PediCal encrypted backup.');
  }

  const salt = base64ToBuffer(parsed.salt);
  const iv = base64ToBuffer(parsed.iv);
  const ciphertext = base64ToBuffer(parsed.ciphertext);
  const iterations = parsed.iterations || PBKDF2_ITERATIONS;

  const key = await deriveWrappingKey(cleanPass, salt, iterations);

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      ciphertext as unknown as BufferSource
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
  } catch (err) {
    throw new Error('Incorrect backup password. Decryption failed.');
  }
}
