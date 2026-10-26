import { validateAppData, type Check } from "./validate";
import { normalizePosition } from "../domain/investments";
import { APP_NAME, READABLE_SCHEMA_VERSIONS, SCHEMA_VERSION, type AppData, type Attachment, type AttachmentRecord } from "./types";
import { decodeAttachmentRecord } from "./attachments";
import { validateAttachmentRecord as validateAttachmentRecordLocal } from "./validate";

/** Export do jedného JSON súboru (FR-17): verzia schémy a dátum exportu. */
/** Najväčší súbor zálohy, ktorý sa načíta: 100 MB (audit A-02, D-132). Zálohy obsahujú prílohy, každá až 2 MB. */
export const BACKUP_MAX_BYTES = 100 * 1024 * 1024;

/** Súbor zálohy nad limit sa nenačíta; kontrola je pri výbere súboru (A-02). */
export function backupTooLarge(bytes: number): boolean {
  return bytes > BACKUP_MAX_BYTES;
}

export function buildBackup(data: AppData, exportedAt: string, attachments: AttachmentRecord[] = []) {
  return {
    app: APP_NAME,
    schemaVersion: SCHEMA_VERSION,
    exportedAt,
    settings: data.settings,
    transactions: data.transactions,
    snapshots: data.snapshots,
    properties: data.properties,
    assets: data.assets,
    investments: data.investments.map(normalizePosition),
    liabilities: data.liabilities,
    incomes: data.incomes,
    recurringExpenses: data.recurringExpenses,
    stockItems: data.stockItems,
    recipes: data.recipes,
    dogs: data.dogs,
    goals: data.goals,
    wasteRecords: data.wasteRecords,
    shoppingItems: data.shoppingItems,
    attachments,
    budgets: data.budgets,
  };
}

/**
 * Import (FR-18): overí verziu schémy a obsah. Vráti dáta alebo chyby.
 * Pri chybe sa nič nemení; zápis robí úložisko až po potvrdení.
 */
export function parseBackup(json: unknown, today: string): Check & { data?: AppData; attachments?: Attachment[]; counts?: { transactions: number; snapshots: number }; notes?: string[] } {
  if (typeof json !== "object" || json === null || Array.isArray(json)) return { ok: false, errors: ["súbor nie je platná záloha"] };
  const o = json as Record<string, unknown>;
  if (o.app !== APP_NAME) return { ok: false, errors: ["súbor nepatrí tejto aplikácii"] };
  if (typeof o.schemaVersion !== "number") return { ok: false, errors: ["chýba verzia schémy"] };
  if (o.schemaVersion > SCHEMA_VERSION) return { ok: false, errors: ["záloha pochádza z novšej verzie aplikácie"] };
  if (!(READABLE_SCHEMA_VERSIONS as readonly number[]).includes(o.schemaVersion)) return { ok: false, errors: [`neznáma verzia schémy ${o.schemaVersion}`] };
  if (typeof o.exportedAt !== "string") return { ok: false, errors: ["chýba dátum exportu"] };
  // Obalové polia overené vyššie; validáciu obsahu prejdú všetky kolekcie (validateAppData, A-07).
  const { app: _app, schemaVersion: _schema, exportedAt: _exp, attachments: rawAttachments, ...content } = o;
  // Verzia 1 nemá majetok: načíta sa prázdny zoznam, dáta sa nestratia (FR-28).
  // Verzia 2 nemá rozpočty (pridané bez zvýšenia verzie, commit 85864ea): načíta sa prázdny zoznam.
  const base = o.schemaVersion === 1 ? { ...content, properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [] } : o.schemaVersion === 2 ? { budgets: [], ...content } : content;
  // Verzie 1 a 2 nemajú pravidelné výdavky: načíta sa prázdny zoznam (D-124).
  // Staršie zálohy nemajú pravidelné výdavky (v3), sklad (v4), recepty (v5) ani položky dokladu (v6): načíta sa prázdny zoznam (D-124, D-127, D-129).
  // Záporné mesačné sporenie vznikalo pred opravou uloženia (nález 1). Pri obnove sa pole vynechá,
  // hodnota sa odvodí z transakcií a import o tom povie v náhľade; zvyšok zálohy sa nestratí.
  const notes: string[] = [];
  let withSettings: Record<string, unknown> = base;
  const settingsIn = base.settings;
  if (typeof settingsIn === "object" && settingsIn !== null && !Array.isArray(settingsIn)) {
    const st: Record<string, unknown> = { ...(settingsIn as Record<string, unknown>) };
    const negative = ["savingInvCents", "savingCashCents"].filter((k) => typeof st[k] === "number" && (st[k] as number) < 0);
    if (negative.length > 0) {
      for (const k of negative) delete st[k];
      withSettings = { ...base, settings: st };
      notes.push("Záporné mesačné sporenie sa pri obnove vynechalo; hodnota sa odvodí z transakcií.");
    }
  }
  const v = validateAppData({ recurringExpenses: [], stockItems: [], recipes: [], dogs: [], goals: [], wasteRecords: [], shoppingItems: [], ...withSettings }, today);
  if (!v.ok) return v;
  // Prílohy (D-160) sa overia voči výdavkom a dekódujú; staršie zálohy ich nemajú.
  const attachments: Attachment[] = [];
  const errors: string[] = [];
  if (rawAttachments !== undefined && !Array.isArray(rawAttachments)) errors.push("záloha: prílohy musia byť pole");
  const transactionIds = new Set(v.data!.transactions.map((t) => t.id));
  const rentalEntryIds = new Set(v.data!.properties.flatMap((p) => (p.rentalLedger ?? []).map((e) => e.id)));
  for (const [n, r] of ((Array.isArray(rawAttachments) ? rawAttachments : []) as unknown[]).entries()) {
    const label = `príloha ${n + 1}`;
    const rowErrors = validateAttachmentRecordLocal(r, label);
    if (rowErrors.length) { errors.push(...rowErrors); continue; }
    const rec = r as AttachmentRecord;
    const owned = rec.transactionId !== undefined ? transactionIds.has(rec.transactionId) : rec.rentalEntryId !== undefined && rentalEntryIds.has(rec.rentalEntryId);
    if (!owned) { errors.push(`${label}: patrí k výdavku alebo záznamu prenájmu, ktorý v zálohe nie je`); continue; }
    try {
      attachments.push(decodeAttachmentRecord(rec));
    } catch {
      errors.push(`${label}: obsah sa nedá načítať`);
    }
  }
  if (errors.length) return { ok: false, errors };
  // Záloha v15 a staršia má jeden cieľ pri položke (goalId); prevedie sa na podiely (D-334).
  if (v.data) v.data = { ...v.data, investments: v.data.investments.map(normalizePosition) };
  return { ok: true, data: v.data, attachments, counts: { transactions: v.data!.transactions.length, snapshots: v.data!.snapshots.length }, notes };
}
