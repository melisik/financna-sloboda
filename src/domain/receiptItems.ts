import type { ReceiptItem } from "./model/entities";

interface ParsedReceiptItems {
  items: ReceiptItem[];
  /** Riadky, ktoré sa nepodarilo rozpoznať; ukážu sa používateľovi, nič sa potichu nevynechá. */
  unparsed: string[];
}

const HEADER = /^(\d+)\s+(.+)$/;
const DETAIL = /^(\d+(?:[,.]\d{1,3})?)x\s+(\d+(?:[,.]\d+)?)%\s+(.+)$/;
const MONEY = /(\d+[,.]\d{2})\s*€/g;

/** „3,50“ → 350 centov; slovenský desatinný oddeľovač alebo bodka. */
function toCents(value: string): number {
  const [euros, cents] = value.replace(".", ",").split(",");
  return Number(euros) * 100 + Number(cents);
}

/**
 * Rozdelí text skopírovaný z portálu na položky. Položka je dvojica riadkov:
 * „kód názov“ a „početx  DPH%  suma €“. Pri viac kusoch sú na riadku dve sumy:
 * jednotková cena a celková cena za všetky kusy (D-129). Iné riadky sa vrátia v `unparsed`.
 */
export function parseReceiptItems(text: string): ParsedReceiptItems {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l !== "");
  const items: ReceiptItem[] = [];
  const unparsed: string[] = [];
  let pending: { code: string; name: string } | null = null;

  for (const line of lines) {
    const detail = DETAIL.exec(line);
    const money = detail ? [...detail[3].matchAll(MONEY)].map((m) => m[1]) : [];
    const quantity = detail ? Number(detail[1].replace(",", ".")) : 0;
    const shapeOk = money.length === 2 || (money.length === 1 && quantity === 1);

    if (detail && pending && shapeOk) {
      const total = toCents(money[money.length - 1]);
      const unit = money.length === 2 ? toCents(money[0]) : total;
      // Jednotková cena × počet sa musí zhodovať so sumou riadku (zaokrúhlenie na centy po kusoch).
      if (Math.abs(unit * quantity - total) <= quantity) {
        items.push({
          code: pending.code,
          name: pending.name,
          quantity,
          vatPercent: Number(detail[2].replace(",", ".")),
          unitPriceCents: unit,
          amountCents: total,
        });
        pending = null;
        continue;
      }
    }
    if (pending) unparsed.push(`${pending.code} ${pending.name}`);
    const header = HEADER.exec(line);
    if (header && !detail) {
      pending = { code: header[1], name: header[2] };
    } else {
      pending = null;
      unparsed.push(line);
    }
  }
  if (pending) unparsed.push(`${pending.code} ${pending.name}`);
  return { items, unparsed };
}
