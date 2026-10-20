/**
 * Čítanie údajov z rozpoznaného textu obalu (sklad potravín). Offline; výsledok sa vždy potvrdzuje ručne.
 */

const DATE_PATTERNS: RegExp[] = [
  /(\d{4})-(\d{2})-(\d{2})/g, // 2027-03-15
  /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4}|\d{2})\b/g, // 15.03.2027, 15/3/27
];

/** Len mesiac a rok, napr. „10.2027“ (obal „spotrebujte do konca“). Nie je súčasťou dňa, napr. v „15.03.2027“. */
const MONTH_YEAR_PATTERN = /(?<![\d.\/-])(\d{1,2})[.\/-](\d{4})(?![\d.\/-])/g;

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
 * Dátum spotreby z textu obalu. Ak je pri dátume kľúčové slovo (spotrebujte, exp, trvanlivosť, použiť),
 * vyberie sa ten; inak prvý platný dátum.
 */
export function findExpiryDate(text: string): string | undefined {
  const candidates: { iso: string; keyword: boolean; index: number }[] = [];
  const keywordRe = /(spotrebujte|spotrebuj|exp|trvanlivos|pou[zž]i[tť]|do:)/i;
  for (const re of [...DATE_PATTERNS, MONTH_YEAR_PATTERN]) {
    for (const m of text.matchAll(re)) {
      if (re === MONTH_YEAR_PATTERN) {
        const iso = lastDayOfMonth(Number(m[2]), Number(m[1]));
        if (!iso || m.index === undefined) continue;
        const before = text.slice(Math.max(0, m.index - 30), m.index);
        candidates.push({ iso, keyword: keywordRe.test(before), index: m.index });
        continue;
      }
      const isIsoForm = m[0].includes("-") && m[1].length === 4;
      const iso = isIsoForm
        ? toIso(Number(m[1]), Number(m[2]), Number(m[3]))
        : toIso(m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]), Number(m[2]), Number(m[1]));
      if (!iso || m.index === undefined) continue;
      const before = text.slice(Math.max(0, m.index - 30), m.index);
      candidates.push({ iso, keyword: keywordRe.test(before), index: m.index });
    }
  }
  if (candidates.length === 0) return undefined;
  candidates.sort((a, b) => Number(b.keyword) - Number(a.keyword) || a.index - b.index);
  return candidates[0].iso;
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
