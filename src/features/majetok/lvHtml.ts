import type { LvFields } from "../../domain/listVlastnictva";

/**
 * Predvyplnenie z uloženej HTML stránky listu vlastníctva (D-211). Berie údaje z buniek tabuliek
 * a z divov „popis → hodnota“, nie z poradia textu. Nič nevolá, skripty z dokumentu sa nespúšťajú.
 */
const text = (el: Element | null | undefined): string => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const PARCEL = /^\d+(?:\/\d+)?$/;

/** Hodnota za popisom v riadku tabuľky; preskočí dvojbodku a čisto číselný kód obce alebo k. ú. */
function valueAfter(cells: Element[], idx: number): string | undefined {
  for (let j = idx + 1; j < cells.length; j++) {
    const t = text(cells[j]);
    if (t === "" || t === ":" || /^\d+$/.test(t)) continue;
    return t;
  }
  return undefined;
}

/** Údaj v riadku hlavičky, napr. „Obec : kód názov Čas vyhotovenia : čas“. */
function headerValue(doc: Document, label: string): string | undefined {
  const td = Array.from(doc.querySelectorAll("td")).find((c) => text(c) === label);
  const cells = Array.from(td?.parentElement?.children ?? []);
  return td ? valueAfter(cells, cells.indexOf(td)) : undefined;
}

/** Hodnota v div, ktorý nasleduje po div s popisom (napr. „Číslo bytu“ → „25“). */
function divValue(doc: Document, label: string): string | undefined {
  const div = Array.from(doc.querySelectorAll("div")).find((d) => text(d) === label);
  const value = text(div?.nextElementSibling);
  return value || undefined;
}

/** Všetky hodnoty v stĺpci tabuľky, ktorého hlavička má zadaný text; každá bunka sa rozdelí na divy. */
function columnValues(doc: Document, header: string): string[] {
  const th = Array.from(doc.querySelectorAll("td")).find((c) => text(c) === header);
  const table = th?.closest("table");
  if (!th || !table) return [];
  const idx = Array.from(th.parentElement?.children ?? []).indexOf(th);
  const values: string[] = [];
  for (const row of Array.from(table.rows)) {
    if (row === th.parentElement) continue;
    const cell = row.children[idx];
    if (!cell) continue;
    const divs = Array.from(cell.querySelectorAll("div"));
    for (const v of divs.length > 0 ? divs.map(text) : [text(cell)]) if (v) values.push(v);
  }
  return values;
}

export function parseLvHtml(html: string): LvFields {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const parcels = [...new Set([...columnValues(doc, "Parcelné číslo"), ...columnValues(doc, "Na pozemku parcelné číslo")].filter((v) => PARCEL.test(v)))];
  const buildingRaw = divValue(doc, "Súpisné číslo") ?? columnValues(doc, "Súpisné číslo").find((v) => /^\d+$/.test(v));
  const flatRaw = divValue(doc, "Číslo bytu");

  const pledges = Array.from(doc.querySelectorAll("td")).map(text).filter((t) => /záložn/i.test(t));
  const out: LvFields = {
    taxMunicipality: headerValue(doc, "Obec"),
    cadastralArea: headerValue(doc, "Katastrálne územie"),
    parcelNumber: parcels.length > 0 ? parcels.join(", ") : undefined,
    buildingNumber: buildingRaw && /^\d+$/.test(buildingRaw) ? buildingRaw : undefined,
    flatNumber: flatRaw && /^\d+[A-Za-z]?$/.test(flatRaw) ? flatRaw : undefined,
    hasPledge: pledges.length > 0,
    pledgeForOwners: pledges.some((t) => /ostatn\S*\s+vlastn/i.test(t)),
    found: [],
  };
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
