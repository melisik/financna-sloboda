/**
 * Moduly a viditeľnosť sekcií (D-162). Jadro je vždy zapnuté. Voliteľné moduly si používateľ zapína
 * v Sprievodcovi prvým nastavením alebo v Nastaveniach. Vypnutie len skryje sekcie: výpočty
 * ani automatické úpravy nečítajú stav modulov, dáta sa nemažú.
 */

/** Sekcie jadra: vždy zobrazené v každej zostave. */
export const CORE_SECTION_IDS = [
  "prehlad",
  "nova-transakcia",
  "scenar-vydavku",
  "mesacny-vydavok",
  "vyhodnotenie",
  "rozpocet",
  "pravidelne-vydavky",
  "nastavenia",
  "zaloha",
] as const;

interface OptionalModule {
  id: string;
  label: string;
  sections: readonly string[];
}

/** Voliteľné moduly. Psy a tlačivo 17-dp-md sú v module Dane (D-162, rozhodnutie zakladateľa). */
export const OPTIONAL_MODULES: readonly OptionalModule[] = [
  { id: "majetok", label: "Majetok (nehnuteľnosti, hypotéka, prenájom)", sections: ["majetok"] },
  { id: "zavazky", label: "Záväzky (úvery a kreditné karty)", sections: ["zavazky"] },
  { id: "investicie", label: "Investície", sections: ["investicie"] },
  { id: "prijmy", label: "Príjmy", sections: ["prijmy"] },
  { id: "dane", label: "Dane (investície, psy, tlačivo 17-dp-md)", sections: ["dane"] },
  { id: "sklad", label: "Sklad a recepty", sections: ["sklad"] },
  { id: "rocny-prehlad", label: "Ročný prehľad", sections: ["rocny-prehlad"] },
];

/**
 * Sekcie, ktoré sa zobrazia. `choice` je uložený výber voliteľných modulov; null znamená, že výber
 * nebol nikdy uložený, a vtedy sú zapnuté všetky (správanie pred D-162). `offered` hovorí, či zostava
 * voliteľné moduly ponúka (príznak Fázy 2).
 */
export function visibleSectionIds(choice: readonly string[] | null, offered: boolean): Set<string> {
  const ids = new Set<string>(CORE_SECTION_IDS);
  if (!offered) return ids;
  for (const m of OPTIONAL_MODULES) {
    if (choice === null || choice.includes(m.id)) m.sections.forEach((s) => ids.add(s));
  }
  return ids;
}

const CHOICE_KEY = "fs-moduly";

/** Výber modulov pre toto zariadenie (per zariadenie, ako preskočenie sprievodcu). Neznáme id sa zahodia. */
export function readModuleChoice(): string[] | null {
  try {
    const raw = localStorage.getItem(CHOICE_KEY);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return null;
    const known = new Set(OPTIONAL_MODULES.map((m) => m.id));
    return value.filter((x): x is string => typeof x === "string" && known.has(x));
  } catch {
    return null;
  }
}

export function writeModuleChoice(ids: readonly string[]): void {
  try {
    localStorage.setItem(CHOICE_KEY, JSON.stringify(ids));
  } catch {
    // bez úložiska sa výber udrží len do obnovenia stránky
  }
}
