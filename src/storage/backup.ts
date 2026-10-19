import { validateAppData, type Check } from "./validate";
import { APP_NAME, READABLE_SCHEMA_VERSIONS, SCHEMA_VERSION, type AppData } from "./types";

/** Export do jedného JSON súboru (FR-17): verzia schémy a dátum exportu. */
export function buildBackup(data: AppData, exportedAt: string) {
  return {
    app: APP_NAME,
    schemaVersion: SCHEMA_VERSION,
    exportedAt,
    settings: data.settings,
    transactions: data.transactions,
    snapshots: data.snapshots,
    properties: data.properties,
    assets: data.assets,
  };
}

/**
 * Import (FR-18): overí verziu schémy a obsah. Vráti dáta alebo chyby.
 * Pri chybe sa nič nemení; zápis robí úložisko až po potvrdení.
 */
export function parseBackup(json: unknown, today: string): Check & { data?: AppData; counts?: { transactions: number; snapshots: number } } {
  if (typeof json !== "object" || json === null || Array.isArray(json)) return { ok: false, errors: ["súbor nie je platná záloha"] };
  const o = json as Record<string, unknown>;
  if (o.app !== APP_NAME) return { ok: false, errors: ["súbor nepatrí tejto aplikácii"] };
  if (typeof o.schemaVersion !== "number") return { ok: false, errors: ["chýba verzia schémy"] };
  if (o.schemaVersion > SCHEMA_VERSION) return { ok: false, errors: ["záloha pochádza z novšej verzie aplikácie"] };
  if (!(READABLE_SCHEMA_VERSIONS as readonly number[]).includes(o.schemaVersion)) return { ok: false, errors: [`neznáma verzia schémy ${o.schemaVersion}`] };
  if (typeof o.exportedAt !== "string") return { ok: false, errors: ["chýba dátum exportu"] };
  // Obalové polia overené vyššie; validácia obsahu vidí len nastavenia, transakcie a vyhodnotenia.
  const { app: _app, schemaVersion: _schema, exportedAt: _exp, ...content } = o;
  // Verzia 1 nemá majetok: načíta sa prázdny zoznam, dáta sa nestratia (FR-28).
  const v = validateAppData(o.schemaVersion === 1 ? { ...content, properties: [], assets: [] } : content, today);
  if (!v.ok) return v;
  return { ok: true, data: v.data, counts: { transactions: v.data!.transactions.length, snapshots: v.data!.snapshots.length } };
}
