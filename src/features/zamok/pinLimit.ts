import type { Repository } from "../../storage/repository";

/**
 * Obmedzenie pokusov pri PIN-e (audit, nález 10). Po piatich nesprávnych pokusoch sa zadávanie
 * dočasne zablokuje; čas rastie dvojnásobne (30 s, 60 s, ...) a je ohraničený na 15 min.
 * Počítadlo je v úložisku, takže obnovenie stránky ho nevynuluje. Nejde o ochranu údajov:
 * PIN údaje nešifruje (D-119), obmedzenie len spomaľuje hádanie v tomto zariadení.
 */
const FREE_ATTEMPTS = 5;
const BASE_SECONDS = 30;
const MAX_SECONDS = 15 * 60;
const KEY = "pinPokusy";

export type PinAttempts = { failures: number; lockedUntil: number };
export const NO_ATTEMPTS: PinAttempts = { failures: 0, lockedUntil: 0 };

/** Počet sekúnd blokovania po n-tom nesprávnom pokuse (0 = bez blokovania). */
export function lockSeconds(failures: number): number {
  if (failures < FREE_ATTEMPTS) return 0;
  return Math.min(BASE_SECONDS * 2 ** (failures - FREE_ATTEMPTS), MAX_SECONDS);
}

/** Stav po nesprávnom pokuse v čase `now` (ms). */
export function afterFailure(prev: PinAttempts, now: number): PinAttempts {
  const failures = prev.failures + 1;
  const seconds = lockSeconds(failures);
  return { failures, lockedUntil: seconds > 0 ? now + seconds * 1000 : 0 };
}

/** Koľko sekúnd (zaokrúhlene nahor) treba ešte čakať; 0 = pokus je dovolený. */
export function waitSeconds(a: PinAttempts, now: number): number {
  return Math.max(0, Math.ceil((a.lockedUntil - now) / 1000));
}

/** Načíta počítadlo. Chýbajúci alebo poškodený záznam sa berie ako žiadne pokusy. */
export async function readAttempts(repo: Pick<Repository, "getMeta">): Promise<PinAttempts> {
  try {
    const raw = await repo.getMeta(KEY);
    if (!raw) return NO_ATTEMPTS;
    const v = JSON.parse(raw) as Partial<PinAttempts>;
    const failures = typeof v.failures === "number" && Number.isInteger(v.failures) && v.failures >= 0 ? v.failures : 0;
    const lockedUntil = typeof v.lockedUntil === "number" && Number.isFinite(v.lockedUntil) ? v.lockedUntil : 0;
    return { failures, lockedUntil };
  } catch {
    return NO_ATTEMPTS;
  }
}

/** Uloží počítadlo do úložiska. */
export async function writeAttempts(repo: Pick<Repository, "setMeta">, a: PinAttempts): Promise<void> {
  await repo.setMeta(KEY, JSON.stringify(a));
}
