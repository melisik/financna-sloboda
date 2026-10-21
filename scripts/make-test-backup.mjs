// Posunie dátumy testovacej zálohy o celé mesiace tak, aby jej najnovšie transakcie patrili do aktuálneho mesiaca.
// Spúšťa sa pri nasadení (pages.yml). Dátumy po dnešku sa zrovnajú s dneškom, lebo import budúci dátum neprijme.
// Použitie: node scripts/make-test-backup.mjs [cesta] (predvolene public/testovacia-zaloha.json)
import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2] ?? "public/testovacia-zaloha.json";
const text = readFileSync(file, "utf8");
const data = JSON.parse(text);
const todayIso = process.env.DEMO_TODAY ?? new Date().toISOString().slice(0, 10);

const monthIndex = (iso) => {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
};

function addMonths(iso, months) {
  const [y, m, d] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ty = Math.floor(total / 12);
  const tm = total % 12;
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return `${String(ty).padStart(4, "0")}-${String(tm + 1).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`;
}

const latest = data.transactions.map((t) => t.date).sort().at(-1);
const shift = monthIndex(todayIso) - monthIndex(latest);
if (shift === 0) {
  console.log(`Testovacia záloha: dátumy sú v aktuálnom mesiaci (${todayIso.slice(0, 7)}), nič sa nemení.`);
  process.exit(0);
}

const updated = text.replace(/\d{4}-\d{2}-\d{2}/g, (iso) => {
  const shifted = addMonths(iso, shift);
  return shifted > todayIso ? todayIso : shifted;
});
writeFileSync(file, updated);
console.log(`Testovacia záloha: dátumy posunuté o ${shift} mes. (najnovšia transakcia ${latest} → aktuálny mesiac ${todayIso.slice(0, 7)}).`);
