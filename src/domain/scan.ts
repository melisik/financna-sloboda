/**
 * Čítanie údajov z rozpoznaného textu obalu (sklad potravín). Offline; výsledok sa vždy potvrdzuje ručne.
 */

const DATE_PATTERNS: RegExp[] = [
  /(\d{4})-(\d{2})-(\d{2})/g, // 2027-03-15
  /(?<!\d)(\d{4})[.\/](\d{1,2})[.\/](\d{1,2})(?!\d)/g, // 2027.03.15
  /(?<![\d.\/-])(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4}|\d{2})\b/g, // 15.03.2027, 15/3/27
  /(?<![\d.\/-])(\d{1,2}) (\d{1,2}) (\d{4})(?!\d)/g, // 15 03 2027
];

/** Len mesiac a rok, napr. „10.2027“ (obal „spotrebujte do konca“). Nie je súčasťou dňa, napr. v „15.03.2027“. */
const MONTH_YEAR_PATTERN = /(?<![\d.\/-])(\d{1,2})[.\/-](\d{4})(?![\d.\/-])/g;

/** Mesiac a dvojciferný rok, napr. „03/27“. Berie sa len pri kľúčovom slove (cena alebo váha by vyzerali rovnako). */
const MONTH_SHORT_YEAR_PATTERN = /(?<![\d.\/-])(\d{1,2})[\/.](\d{2})(?![\d.\/-])/g;

/** Kľúčové slová pred dátumom spotreby a trvanlivosti. */
const KEYWORD_RE = /(spotrebujte|spotrebuj|spotreb|exp|trvanlivos|najlep|pou[zž]i[tť]|do:)/i;

/** Dátum výroby alebo balenia nie je dátum spotreby; ak je pred dátumom, má nižšiu prioritu. */
const PRODUCTION_RE = /(vyrob|výrob|zabal|plnen|balen)/i;

/** OCR často zamení nuly a jednotky za písmená (O, I, l) v dátumoch; opravíme len tvary, ktoré vyzerajú ako dátum. */
function fixOcrDigits(text: string): string {
  return text
    .replace(/[0-9OIl]{1,4}([.\/\- ])[0-9OIl]{1,2}\1[0-9OIl]{2,4}|[0-9OIl]{1,2}[.\/][0-9OIl]{4}/g, (m) =>
      m.replace(/[OIl]/g, (c) => (c === "O" ? "0" : "1")),
    );
}

/** Posledný deň mesiaca ako ISO reťazec („10.2027“ → 2027-10-31), alebo undefined. */
function lastDayOfMonth(year: number, month: number): string | undefined {
  if (month < 1 || month > 12) return undefined;
  const day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return toIso(year, month, day);
}

/** Kalendárne platný dátum ako ISO reťazec, alebo undefined. */
function toIso(year: number, month: number, day: number): string | undefined {
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return undefined;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Dátum spotreby z textu obalu. Pri dátume sa pozerá na kľúčové slovo pred ním (spotrebujte, exp, trvanlivosť, použiť);
 * dátum výroby sa berie až ako posledný. Inak prvý platný dátum.
 */
export function findExpiryDate(raw: string): string | undefined {
  const text = fixOcrDigits(raw);
  const candidates: { iso: string; keyword: boolean; production: boolean; index: number }[] = [];
  const add = (iso: string | undefined, index: number) => {
    if (!iso) return;
    const before = text.slice(Math.max(0, index - 30), index);
    candidates.push({ iso, keyword: KEYWORD_RE.test(before), production: PRODUCTION_RE.test(before), index });
  };

  for (const re of DATE_PATTERNS) {
    for (const m of text.matchAll(re)) {
      if (m.index === undefined) continue;
      const yearFirst = m[1].length === 4;
      const year = yearFirst ? Number(m[1]) : Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
      const month = Number(m[2]);
      const day = Number(yearFirst ? m[3] : m[1]);
      add(toIso(year, month, day), m.index);
    }
  }
  for (const m of text.matchAll(MONTH_YEAR_PATTERN)) {
    if (m.index !== undefined) add(lastDayOfMonth(Number(m[2]), Number(m[1])), m.index);
  }
  for (const m of text.matchAll(MONTH_SHORT_YEAR_PATTERN)) {
    if (m.index === undefined) continue;
    if (!KEYWORD_RE.test(text.slice(Math.max(0, m.index - 30), m.index))) continue;
    add(lastDayOfMonth(2000 + Number(m[2]), Number(m[1])), m.index);
  }

  // Dátum výroby bez kľúčového slova sa nepoužije ako dátum spotreby.
  const usable = candidates.filter((c) => c.keyword || !c.production);
  if (usable.length === 0) return undefined;
  usable.sort((a, b) => Number(b.keyword) - Number(a.keyword) || a.index - b.index);
  return usable[0].iso;
}

/** Názov produktu: prvý riadok s aspoň tromi písmenami, ktorý nie je dátum a nie je príliš dlhý. */
export function findProductName(text: string): string | undefined {
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const letters = (line.match(/\p{L}/gu) ?? []).length;
    if (letters < 3 || line.length > 60) continue;
    if (DATE_PATTERNS.some((re) => new RegExp(re.source).test(line)) || new RegExp(MONTH_YEAR_PATTERN.source).test(line)) continue;
    return line;
  }
  return undefined;
}
