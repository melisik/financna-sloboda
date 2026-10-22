/**
 * Predvyplnenie z textu listu vlastníctva (D-209). Čistá funkcia: nič neukladá a nevolá sieť.
 * Berie len údaje pre daň a upozornenie na záložné právo. Vlastníkov, mená, adresy a číslo LV ignoruje.
 */
export type LvFields = {
  taxMunicipality?: string;
  cadastralArea?: string;
  parcelNumber?: string;
  buildingNumber?: string;
  flatNumber?: string;
  taxObjectKind?: "dom" | "byt";
  hasPledge: boolean;
  found: string[];
};

const valueOf = (text: string, re: RegExp): string | undefined => {
  const m = text.match(re);
  const v = m?.[1]?.trim();
  return v ? v : undefined;
};

export function parseLvText(raw: string): LvFields {
  const text = raw.replace(/\r/g, "");
  const out: LvFields = { hasPledge: /záložn/i.test(text), found: [] };
  out.taxMunicipality = valueOf(text, /^[^\S\n]*Obec[^\S\n]*:[^\S\n]*(.+)$/im);
  out.cadastralArea = valueOf(text, /Katastrálne[^\S\n]+územie[^\S\n]*:[^\S\n]*(.+)$/im);
  out.parcelNumber = valueOf(text, /(?:Parc\.[^\S\n]*č\.|Parcelné[^\S\n]+číslo|Parcela[^\S\n]+č\.)[^\S\n]*:?[^\S\n]*([0-9]+(?:\/[0-9]+)?)/i);
  out.buildingNumber = valueOf(text, /Súpisné[^\S\n]+číslo[^\S\n]*:?[^\S\n]*([0-9]+)/i);
  out.flatNumber = valueOf(text, /Byt[^\S\n]*č\.[^\S\n]*:?[^\S\n]*([0-9]+[A-Za-z]?)/i);
  out.taxObjectKind = out.flatNumber ? "byt" : out.buildingNumber ? "dom" : undefined;

  const labels: [keyof LvFields, string][] = [
    ["taxMunicipality", "obec"],
    ["cadastralArea", "katastrálne územie"],
    ["parcelNumber", "číslo parcely"],
    ["buildingNumber", "súpisné číslo"],
    ["flatNumber", "číslo bytu"],
    ["taxObjectKind", "druh objektu"],
  ];
  for (const [key, label] of labels) if (out[key]) out.found.push(label);
  return out;
}
