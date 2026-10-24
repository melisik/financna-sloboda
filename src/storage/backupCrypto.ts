import { APP_NAME } from "./types";

/**
 * Šifrovaná záloha (N-05, D-276): voliteľné heslo na export. Kľúč sa odvodí z hesla cez PBKDF2-SHA256,
 * dáta sa šifrujú AES-GCM-256. Všetko beží v prehliadači cez Web Crypto, bez servera (D-009).
 * Heslo sa nikam neukladá a nedá sa obnoviť: bez neho sa záloha neotvorí.
 */
export const MIN_PASSWORD_LENGTH = 8;
/** Predvolený počet iterácií PBKDF2 (odporúčanie OWASP pre PBKDF2-SHA256). */
export const DEFAULT_ITERATIONS = 600_000;
const MIN_ITERATIONS = 100_000;
const MAX_ITERATIONS = 2_000_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
/** Viazané na formát: zmena formátu sa musí prejaviť aj tu, aby sa staré súbory nedali zameniť. */
const AAD = new TextEncoder().encode("financna-sloboda-zaloha-v1");
const CHUNK = 0x8000;

export interface EncryptedBackup {
  app: string;
  encrypted: true;
  format: 1;
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  data: string;
}

export function isEncryptedBackup(json: unknown): json is EncryptedBackup {
  return typeof json === "object" && json !== null && (json as { encrypted?: unknown }).encrypted === true;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(binary);
}

function fromBase64(text: string, expectedBytes?: number): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  if (expectedBytes !== undefined && bytes.length !== expectedBytes) throw new Error("zlá dĺžka");
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number, usage: "encrypt" | "decrypt"): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, [usage]);
}

export async function encryptBackup(plainText: string, password: string, iterations = DEFAULT_ITERATIONS): Promise<EncryptedBackup> {
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`heslo musí mať aspoň ${MIN_PASSWORD_LENGTH} znakov`);
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt, iterations, "encrypt");
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: AAD }, key, new TextEncoder().encode(plainText));
  return {
    app: APP_NAME,
    encrypted: true,
    format: 1,
    kdf: "PBKDF2-SHA256",
    iterations,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(cipher)),
  };
}

/** Vráti pôvodný text zálohy. Pri zlom hesle alebo upravenom súbore vyhodí chybu a nič nevráti. */
export async function decryptBackup(backup: EncryptedBackup, password: string): Promise<string> {
  if (backup.kdf !== "PBKDF2-SHA256" || backup.format !== 1) throw new Error("nepodporovaný formát zálohy");
  if (!Number.isInteger(backup.iterations) || backup.iterations < MIN_ITERATIONS || backup.iterations > MAX_ITERATIONS) {
    throw new Error("nevhodný počet iterácií");
  }
  let salt: Uint8Array<ArrayBuffer>;
  let iv: Uint8Array<ArrayBuffer>;
  let data: Uint8Array<ArrayBuffer>;
  try {
    salt = fromBase64(backup.salt, SALT_BYTES);
    iv = fromBase64(backup.iv, IV_BYTES);
    data = fromBase64(backup.data);
  } catch {
    throw new Error("súbor je poškodený");
  }
  const key = await deriveKey(password, salt, backup.iterations, "decrypt");
  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: AAD }, key, data);
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error("heslo nesedí alebo je súbor poškodený");
  }
}
