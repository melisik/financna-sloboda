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

/** Vyčistí hodnotu z riadku: odreže časové údaje hlavičky a kód pred názvom (D-209). */
const clean = (v: string | undefined): string | undefined => {
  if (!v) return undefined;
  const c = v
    .replace(/\s+(?:Čas\s+vyhotovenia|Údaje\s+platné|Dátum|Stav\s+k)(?=[\s:]|$)[\s\S]*$/i, "")
    .replace(/^\d+\s+/, "")
    .trim();
  return c || undefined;
};

const lineValue = (text: string, re: RegExp): string | undefined => clean(text.match(re)?.[1]);

/** Všetky rôzne hodnoty, napr. všetky parcely (aj keď ich je viac). */
const allValues = (text: string, re: RegExp): string[] => {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  const values = [...text.matchAll(new RegExp(re.source, flags))].map((m) => m[1].trim());
  return [...new Set(values)];
};

const PARCEL_RE = /(?:Parc\.[^\S\n]*č\.|Parcelné[^\S\n]+číslo|Parcela[^\S\n]+č\.)[^\S\n]*:?[^\S\n]*([0-9]+(?:\/[0-9]+)?)/i;
const BUILDING_RE = /\bsúp(?:isn[^\s:]*|\.)?[^\S\n]*(?:č\.|čísl[^\s:]*)?[^\S\n]*(?:(?:budov|stavb)[^\s:]*[^\S\n]*)?:?[^\S\n]*([0-9]+)/i;

export function parseLvText(raw: string): LvFields {
  const text = raw.replace(/\r/g, "");
  const out: LvFields = { hasPledge: /záložn/i.test(text), found: [] };
  out.taxMunicipality = lineValue(text, /^[^\S\n]*Obec[^\S\n]*:[^\S\n]*(.+)$/im);
  out.cadastralArea = lineValue(text, /Katastrálne[^\S\n]+územie[^\S\n]*:[^\S\n]*(.+)$/im);
  const parcels = allValues(text, PARCEL_RE);
  out.parcelNumber = parcels.length > 0 ? parcels.join(", ") : undefined;
  out.buildingNumber = lineValue(text, BUILDING_RE);
  out.flatNumber = lineValue(text, /Byt[^\S\n]*č\.[^\S\n]*:?[^\S\n]*([0-9]+[A-Za-z]?)/i);
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
