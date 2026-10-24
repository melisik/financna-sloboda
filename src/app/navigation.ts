/**
 * Navigácia medzi sekciami (D-205). Sekcie a ich skupiny sú v čistom zozname bez UI,
 * aby ich mohli používať aj testy. Horný panel ich zobrazuje v dvoch riadkoch.
 */
export type SectionId = "prehlad" | "nova-transakcia" | "scenar-vydavku" | "prijmy" | "rozpocet" | "vyhodnotenie" | "majetok" | "zavazky" | "investicie" | "pravidelne-vydavky" | "dane" | "sklad" | "rocny-prehlad" | "nastavenia" | "zaloha";

export const SECTION_LABELS: Record<SectionId, string> = {
  prehlad: "Prehľad",
  "nova-transakcia": "Transakcie",
  "scenar-vydavku": "Veľký výdavok (scenár)",
  prijmy: "Príjmy",
  rozpocet: "Rozpočet",
  vyhodnotenie: "Vyhodnotenie",
  majetok: "Majetok",
  zavazky: "Záväzky",
  investicie: "Investície",
  "pravidelne-vydavky": "Pravidelné výdavky",
  dane: "Dane",
  sklad: "Sklad",
  "rocny-prehlad": "Ročný prehľad",
  nastavenia: "Nastavenia",
  zaloha: "Záloha",
};

type NavGroup ={ id: string; label: string; sections: SectionId[] };

/** Päť skupín v poradí zobrazenia. Klepnutie na skupinu otvorí jej prvú sekciu. */
export const NAV_GROUPS: NavGroup[] = [
  { id: "prehlad", label: "Prehľad", sections: ["prehlad"] },
  { id: "peniaze", label: "Peniaze", sections: ["nova-transakcia", "scenar-vydavku", "prijmy", "rozpocet", "pravidelne-vydavky"] },
  { id: "majetok", label: "Majetok a zásoby", sections: ["majetok", "sklad", "zavazky", "investicie", "dane"] },
  { id: "plan", label: "Plán a výsledky", sections: ["vyhodnotenie", "rocny-prehlad"] },
  { id: "nastavenia", label: "Nastavenia a záloha", sections: ["nastavenia", "zaloha"] },
];

/** Skupina, do ktorej patrí sekcia. Každá sekcia patrí práve do jednej skupiny. */
export function groupOf(id: SectionId): NavGroup {
  const g = NAV_GROUPS.find((x) => x.sections.includes(id));
  if (!g) throw new Error(`sekcia bez skupiny: ${id}`);
  return g;
}
