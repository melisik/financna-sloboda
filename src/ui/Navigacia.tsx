import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { NAV_GROUPS, SECTION_LABELS, type SectionId } from "../app/navigation";
import { useModules } from "./Moduly";

export type { SectionId } from "../app/navigation";

/** Navigácia: zoznam sekcií, výber podľa kotvy v adrese a horný panel (D-170). Je vo vrstve ui, nie vo features: pozná všetky sekcie. */

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

/** Horný panel (D-170, D-205): päť skupín v prvom riadku, sekcie vybranej skupiny v druhom. Dotyková plocha aspoň 44 px. */
export function Nav({ active }: { active: SectionId }) {
  const { visible } = useModules();
  const groups = NAV_GROUPS.map((g) => ({ ...g, shown: g.sections.filter((id) => visible.has(id)) })).filter((g) => g.shown.length > 0);
  const activeGroup = groups.find((g) => g.sections.includes(active));
  const chip = (on: boolean): CSSProperties => ({
    minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 12px", borderRadius: 999, border: "1px solid var(--border-soft)",
    background: on ? "var(--ok-bg)" : "var(--surface)", color: "inherit", whiteSpace: "nowrap", fontSize: "var(--font-small)", fontWeight: on ? 700 : 400,
    textDecoration: "none", cursor: "pointer",
  });
  const rowRef = useRef<HTMLDivElement>(null);
  // Aktívna sekcia môže byť v riadku vpravo mimo obrazovky: posuň riadok (nie stránku), aby bola viditeľná (docs/40).
  useEffect(() => {
    const row = rowRef.current;
    const el = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!row || !el) return;
    const r = row.getBoundingClientRect();
    const c = el.getBoundingClientRect();
    if (c.right > r.right) row.scrollLeft += c.right - r.right + 8;
    else if (c.left < r.left) row.scrollLeft -= r.left - c.left + 8;
  }, [active]);
  // Výška prilepeného menu ako odsadenie posúvania: zameraný prvok (napr. potvrdenie vo formulári) neskončí pod menu.
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = barRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const set = () => document.documentElement.style.setProperty("scroll-padding-top", `${el.offsetHeight + 8}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={barRef} style={{ position: "sticky", top: 0, background: "var(--surface)", zIndex: 1, borderBottom: "1px solid var(--border-soft)" }}>
      <nav aria-label="Hlavná navigácia" style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 0" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={g === activeGroup}
              onClick={() => {
                if (g !== activeGroup) window.location.hash = g.shown[0];
              }}
              style={chip(g === activeGroup)}
            >
              {g.label}
            </button>
          ))}
        </div>
        {activeGroup && activeGroup.shown.length > 1 && (
          // Sekcie: na telefóne jeden riadok, ktorý sa posúva do strany; od 600 px sa zalomí (docs/40, variant C, trieda v index.html).
          <div ref={rowRef} className="nav-sections">
            {activeGroup.shown.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={id === active ? "page" : undefined}
                // Aktívna sekcia: adresa sa nemení, prehliadač by skočil na kotvu pod prilepené menu. Ostaň na začiatku (docs/39).
                onClick={(e) => {
                  if (id === active) {
                    e.preventDefault();
                    window.scrollTo(0, 0);
                  }
                }}
                style={chip(id === active)}
              >
                {SECTION_LABELS[id]}
              </a>
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}
