/** Položka dokladu skopírovaná z portálu (Over doklad). Suma je uvedená na riadku portálu. */
export interface ReceiptItem {
  code: string;
  name: string;
  quantity: number;
  vatPercent: number;
  amountCents: number;
}

export interface ParsedReceiptItems {
  items: ReceiptItem[];
  /** Riadky, ktoré sa nepodarilo rozpoznať; ukážu sa používateľovi, nič sa potichu nevynechá. */
  unparsed: string[];
}

const HEADER = /^(\d+)\s+(.+)$/;
const DETAIL = /^(\d+(?:[,.]\d{1,3})?)x\s+(\d+(?:[,.]\d+)?)%\s+(\d+[,.]\d{2})\s*€$/;

/** „3,50“ → 350 centov; slovenský desatinný oddeľovač alebo bodka. */
function toCents(value: string): number {
  const [euros, cents] = value.replace(".", ",").split(",");
  return Number(euros) * 100 + Number(cents);
}

/**
 * Rozdelí text skopírovaný z portálu na položky. Položka je dvojica riadkov:
 * „kód názov“ a „početx  DPH%  suma €“. Iné riadky sa vrátia v `unparsed`.
 */
export function parseReceiptItems(text: string): ParsedReceiptItems {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l !== "");
  const items: ReceiptItem[] = [];
  const unparsed: string[] = [];
  let pending: { code: string; name: string } | null = null;

  for (const line of lines) {
    const detail = DETAIL.exec(line);
    if (detail && pending) {
      items.push({
        code: pending.code,
        name: pending.name,
        quantity: Number(detail[1].replace(",", ".")),
        vatPercent: Number(detail[2].replace(",", ".")),
        amountCents: toCents(detail[3]),
      });
      pending = null;
      continue;
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
