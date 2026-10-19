import { validateIncome } from "./validate";
import { INCOME_FREQUENCIES, INCOME_KINDS, type RegularIncome } from "./types";

/**
 * Súbor od integračnej služby (D-112, docs/15). Aplikácia ho len číta; nikdy sa nevolá sieť.
 * Verzia formátu 1: {"app":"integracna-sluzba","feedVersion":1,"source":…,"fetchedAt":…,"items":[…]}.
 */
export const FEED_APP = "integracna-sluzba";
export const FEED_VERSION = 1;
/** Horný limit veľkosti súboru; väčší súbor sa odmietne bez čítania (1 MB). */
export const FEED_MAX_BYTES = 1_000_000;

export interface ParsedFeed {
  source: string;
  fetchedAt: string;
  items: RegularIncome[];
}

export type FeedCheck = { ok: true; feed: ParsedFeed } | { ok: false; errors: string[] };

const FEED_KEYS = ["app", "feedVersion", "source", "fetchedAt", "items"];
const ITEM_KEYS = ["id", "kind", "frequency", "name", "amountCents", "startDate", "endDate", "dayOfMonth"];

/** Overí a prevedie súbor na príjmy. Pri akejkoľvek chybe sa nič nezapíše. */
export function parseFeed(json: unknown): FeedCheck {
  if (typeof json !== "object" || json === null || Array.isArray(json)) return { ok: false, errors: ["súbor nie je platný"] };
  const o = json as Record<string, unknown>;
  const errors: string[] = [];
  for (const k of Object.keys(o)) if (!FEED_KEYS.includes(k)) errors.push(`neznáme pole „${k}“`);
  if (o.app !== FEED_APP) errors.push("súbor nepochádza z integračnej služby");
  if (o.feedVersion !== FEED_VERSION) errors.push(`neznáma verzia formátu ${String(o.feedVersion)}`);
  if (typeof o.source !== "string" || o.source.trim().length === 0 || o.source.length > 80) errors.push("zdroj je povinný, max 80 znakov");
  if (typeof o.fetchedAt !== "string" || Number.isNaN(Date.parse(o.fetchedAt))) errors.push("dátum získania musí byť platný čas (ISO)");
  if (!Array.isArray(o.items)) errors.push("items musí byť pole");
  if (errors.length) return { ok: false, errors };

  const source = (o.source as string).trim();
  const fetchedAt = o.fetchedAt as string;
  const items: RegularIncome[] = [];
  (o.items as unknown[]).forEach((raw, n) => {
    const label = `položka ${n + 1}`;
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      errors.push(`${label}: musí byť objekt`);
      return;
    }
    const it = raw as Record<string, unknown>;
    for (const k of Object.keys(it)) if (!ITEM_KEYS.includes(k)) errors.push(`${label}: neznáme pole „${k}“`);
    if (typeof it.id !== "string" || it.id.length === 0) errors.push(`${label}: chýba id`);
    if (!(INCOME_KINDS as readonly unknown[]).includes(it.kind)) errors.push(`${label}: druh musí byť z katalógu`);
    if (!(INCOME_FREQUENCIES as readonly unknown[]).includes(it.frequency)) errors.push(`${label}: frekvencia musí byť pravidelná alebo nepravidelná`);
    const now = fetchedAt;
    const mapped = {
      id: `ext:${source}:${String(it.id)}`,
      name: it.name,
      kind: it.kind,
      frequency: it.frequency,
      amountCents: it.amountCents,
      startDate: it.startDate,
      ...(it.endDate !== undefined ? { endDate: it.endDate } : {}),
      ...(it.dayOfMonth !== undefined ? { dayOfMonth: it.dayOfMonth } : {}),
      source,
      fetchedAt,
      createdAt: now,
      updatedAt: now,
    };
    const itemErrors = validateIncome(mapped, label);
    if (itemErrors.length) errors.push(...itemErrors);
    else items.push(mapped as RegularIncome);
  });
  if (errors.length) return { ok: false, errors };
  return { ok: true, feed: { source, fetchedAt, items } };
}
