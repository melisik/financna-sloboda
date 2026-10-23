import { floorAreaFromShare, type LvFields, type LvFlatChoice, type LvTaxFields } from "../../domain/listVlastnictva";

/**
 * Predvyplnenie z uloženej HTML stránky listu vlastníctva (D-211, D-214). Berie údaje z buniek tabuliek
 * a z divov „popis → hodnota“, nie z poradia textu. Každý byt sa berie z vlastnej tabuľky.
 * Nič nevolá, skripty z dokumentu sa nespúšťajú.
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

/** Vlastný text prvku: len priame textové uzly, bez obsahu vnorených prvkov (portál píše popis pred <br>). */
function ownText(el: Element): string {
  return Array.from(el.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Prvky s popisom: div (starší tvar) alebo bunka tabuľky (portál: popis, <br> a hodnota v odkaze). */
function labelElements(root: Element | Document, label: string, startsWith = false): Element[] {
  return Array.from(root.querySelectorAll("div, td, th")).filter((el) => (startsWith ? ownText(el).startsWith(label) : ownText(el) === label));
}

/** Hodnota popisu: text za popisom v tom istom prvku, inak nasledujúci súrodenec. */
function valueFor(el: Element, label: string): string | undefined {
  const same = text(el).startsWith(label) ? text(el).slice(label.length).trim() : "";
  return same || text(el.nextElementSibling) || undefined;
}

/** Prvá hodnota popisu v bloku, ktorá prejde kontrolou (napr. „Číslo bytu“ → „25“). */
function blockValue(block: Element | Document, label: string, valid: (v: string) => boolean = () => true): string | undefined {
  for (const el of labelElements(block, label)) {
    const v = valueFor(el, label);
    if (v && valid(v)) return v;
  }
  return undefined;
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

/** Tabuľky bytov: každá tabuľka, ktorá obsahuje popis „Číslo bytu“ (D-214). */
function flatTables(doc: Document): HTMLTableElement[] {
  const tables = labelElements(doc, "Číslo bytu").map((el) => el.closest("table"));
  return [...new Set(tables)].filter((t): t is HTMLTableElement => t !== null);
}

/** Podlahová plocha z podielu v bloku bytu (D-212). */
function blockShare(block: Element): number | undefined {
  const el = labelElements(block, "Podiel priestoru", true)[0];
  if (!el) return undefined;
  const m = text(el).match(/(\d+)\/(\d+)$/) ?? text(el.nextElementSibling).match(/^(\d+)\/(\d+)$/);
  return m ? floorAreaFromShare(Number(m[1]), Number(m[2])) : undefined;
}

export function parseLvHtml(html: string): LvFields {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const parcels = [...new Set([...columnValues(doc, "Parcelné číslo"), ...columnValues(doc, "Na pozemku parcelné číslo")].filter((v) => PARCEL.test(v)))];
  const shared: LvTaxFields = {
    taxMunicipality: headerValue(doc, "Obec"),
    cadastralArea: headerValue(doc, "Katastrálne územie"),
    parcelNumber: parcels.length > 0 ? parcels.join(", ") : undefined,
  };

  const flats: LvFlatChoice[] = [];
  for (const block of flatTables(doc)) {
    const flat = blockValue(block, "Číslo bytu", (v) => /^\d+[A-Za-z]?$/.test(v));
    const floor = blockValue(block, "Poschodie", (v) => /^\d+$/.test(v));
    const building = blockValue(block, "Súpisné číslo", (v) => /^\d+$/.test(v));
    if (!flat || !/^\d+[A-Za-z]?$/.test(flat)) continue;
    const label = [`byt č. ${flat}`, floor && /^\d+$/.test(floor) ? `poschodie ${floor}` : "", building && /^\d+$/.test(building) ? `súp. č. ${building}` : ""]
      .filter(Boolean)
      .join(", ");
    flats.push({
      label,
      fields: {
        ...shared,
        flatNumber: flat,
        buildingNumber: building && /^\d+$/.test(building) ? building : undefined,
        floorAreaSqm: blockShare(block),
        taxObjectKind: "byt",
      },
    });
  }

  const documentBuilding = blockValue(doc, "Súpisné číslo", (v) => /^\d+$/.test(v)) ?? columnValues(doc, "Súpisné číslo").find((v) => /^\d+$/.test(v));
  const base: LvTaxFields = flats.length > 0
    ? flats[0].fields
    : { ...shared, buildingNumber: documentBuilding && /^\d+$/.test(documentBuilding) ? documentBuilding : undefined, taxObjectKind: documentBuilding ? "dom" : undefined };

  const pledges = Array.from(doc.querySelectorAll("td")).map(text).filter((t) => /záložn/i.test(t));
  const out: LvFields = {
    ...base,
    hasPledge: pledges.length > 0,
    pledgeForOwners: pledges.some((t) => /ostatn\S*\s+vlastn/i.test(t)),
    found: [],
    flats: flats.length > 1 ? flats : undefined,
  };
  const labels: [keyof LvTaxFields, string][] = [
    ["taxMunicipality", "obec"],
    ["cadastralArea", "katastrálne územie"],
    ["parcelNumber", "číslo parcely"],
    ["buildingNumber", "súpisné číslo"],
    ["flatNumber", "číslo bytu"],
    ["floorAreaSqm", "podlahová plocha"],
    ["taxObjectKind", "druh objektu"],
  ];
  for (const [key, label] of labels) if (out[key]) out.found.push(label);
  return out;
}
