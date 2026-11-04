// Posunie dátumy testovacej zálohy o celé mesiace tak, aby referenčný dátum (exportedAt zálohy)
// padol do aktuálneho mesiaca nasadenia. Budúce dátumy (expirácie, termíny záväzkov) si zachovajú
// relatívny odstup – nikdy sa neorezávajú na dnešok.
// Spúšťa sa pri nasadení (pages.yml).
// Použitie: node scripts/make-test-backup.mjs [cesta] (predvolene public/testovacia-zaloha.json)
import { readFileSync, writeFileSync } from "node:fs";

/** Vráti index mesiaca: jan 2026 = 2026*12+0, nov 2026 = 2026*12+10 */
export function monthIndex(iso) {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
}

/** Posunie dátum YYYY-MM-DD o daný počet mesiacov; správne ošetrí rôznu dĺžku mesiacov. */
export function addMonths(iso, months) {
  const [y, m, d] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ty = Math.floor(total / 12);
  const tm = total % 12;
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return `${String(ty).padStart(4, "0")}-${String(tm + 1).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`;
}

/**
 * Vypočíta posun v celých mesiacoch od referenčného dátumu zálohy (exportedAt)
 * po dátum nasadenia (deployDate). Môže byť záporný (spätné posúvanie) alebo nula.
 */
export function computeShift(refDate, deployDate) {
  return monthIndex(deployDate) - monthIndex(refDate);
}

/**
 * Posunie všetky dátumy (vzor YYYY-MM-DD) v texte zálohy o daný počet mesiacov.
 * Bez orezávania – budúce dátumy si zachovajú relatívny odstup od referenčného dátumu.
 */
export function shiftDates(text, shift) {
  if (shift === 0) return text;
  return text.replace(/\d{4}-\d{2}-\d{2}/g, (iso) => addMonths(iso, shift));
}

// CLI spustenie – len keď je súbor priamo volaný (nie importovaný ako modul)
if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("make-test-backup.mjs")) {
  const file = process.argv[2] ?? "public/testovacia-zaloha.json";
  const text = readFileSync(file, "utf8");
  const data = JSON.parse(text);
  const deployDate = process.env.DEMO_TODAY ?? new Date().toISOString().slice(0, 10);

  const refDate = data.exportedAt?.slice(0, 10);
  if (!refDate) {
    console.error("Záloha neobsahuje pole exportedAt – posun nie je možný.");
    process.exit(1);
  }

  const shift = computeShift(refDate, deployDate);

  if (shift === 0) {
    console.log(
      `Testovacia záloha: referenčný dátum ${refDate} je v aktuálnom mesiaci (${deployDate.slice(0, 7)}), nič sa nemení.`
    );
    process.exit(0);
  }

  const updated = shiftDates(text, shift);
  writeFileSync(file, updated);
  console.log(
    `Testovacia záloha: dátumy posunuté o ${shift > 0 ? "+" : ""}${shift} mes. (exportedAt ${refDate} → ${deployDate.slice(0, 7)}).`
  );
}
