/**
 * Lokálny PIN (D-119). Bráni otvoreniu appky v tomto zariadení; údaje sa nešifrujú.
 * Ukladá sa len hash PBKDF2-SHA256 s náhodnou soľou. Bez servera a bez účtov.
 */
const ITERATIONS = 150_000;

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

const toB64 = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
const fromB64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(pin: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" }, key, 256);
  return toB64(bits);
}

/** Vytvorí záznam pre úložisko: JSON so soľou a hashom. */
export async function makePinRecord(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return JSON.stringify({ salt: toB64(salt), hash: await derive(pin, salt) });
}

/** Overí PIN voči záznamu. Chybný záznam sa berie ako nesprávny PIN. */
export async function checkPin(pin: string, record: string): Promise<boolean> {
  try {
    const { salt, hash } = JSON.parse(record) as { salt: string; hash: string };
    return (await derive(pin, fromB64(salt))) === hash;
  } catch {
    return false;
  }
}
