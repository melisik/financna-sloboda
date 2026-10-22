import { useEffect, useState } from "react";
import { useModules } from "./Moduly";

/** Navigácia: zoznam sekcií, výber podľa kotvy v adrese a horný panel (D-170). Je vo vrstve ui, nie vo features: pozná všetky sekcie. */

export type SectionId = "prehlad" | "nova-transakcia" | "prijmy" | "rozpocet" | "vyhodnotenie" | "majetok" | "zavazky" | "investicie" | "pravidelne-vydavky" | "dane" | "sklad" | "rocny-prehlad" | "nastavenia" | "zaloha";

const NAV: { id: SectionId; label: string }[] = [
  { id: "prehlad", label: "Prehľad" },
  { id: "nova-transakcia", label: "Transakcie" },
  { id: "prijmy", label: "Príjmy" },
  { id: "rozpocet", label: "Rozpočet" },
  { id: "vyhodnotenie", label: "Vyhodnotenie" },
  { id: "majetok", label: "Majetok" },
  { id: "zavazky", label: "Záväzky" },
  { id: "investicie", label: "Investície" },
  { id: "pravidelne-vydavky", label: "Pravidelné výdavky" },
  { id: "dane", label: "Dane" },
  { id: "sklad", label: "Sklad" },
  { id: "rocny-prehlad", label: "Ročný prehľad" },
  { id: "nastavenia", label: "Nastavenia" },
  { id: "zaloha", label: "Záloha" },
];

/** Sekcia z kotvy v adrese; bez platnej kotvy ide na Prehľad. */
function sectionFromHash(visible: Set<string>): SectionId {
  const id = window.location.hash.slice(1);
  return visible.has(id) ? (id as SectionId) : "prehlad";
}

/** Zobrazí sa len jedna sekcia; zmena kotvy (odkaz v paneli) ju prepne. */
export function useSection(visible: Set<string>): SectionId {
  const [section, setSection] = useState<SectionId>(() => sectionFromHash(visible));
  useEffect(() => {
    const onChange = () => {
      setSection(sectionFromHash(visible));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, [visible]);
  // Skrytú sekciu (po vypnutí modulu) nahradí Prehľad, aj keď ju ešte držal stav.
  return visible.has(section) ? section : "prehlad";
}

/** Horný panel: všetky viditeľné sekcie naraz; ak sa nezmestia do riadku, zalomia sa do ďalšieho (D-170). Dotyková plocha aspoň 44 px. */
export function Nav({ active }: { active: SectionId }) {
  const { visible } = useModules();
  return (
    <div style={{ position: "sticky", top: 0, background: "var(--surface)", zIndex: 1, borderBottom: "1px solid var(--border-soft)" }}>
      <nav aria-label="Hlavná navigácia" style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 0" }}>
        {NAV.filter((n) => visible.has(n.id)).map((n) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            aria-current={n.id === active ? "page" : undefined}
            style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 12px", borderRadius: 999, border: "1px solid var(--border-soft)", background: n.id === active ? "var(--ok-bg)" : "var(--surface)", color: "inherit", whiteSpace: "nowrap", fontSize: "0.9rem", fontWeight: n.id === active ? 700 : 400, textDecoration: "none" }}
          >
            {n.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
