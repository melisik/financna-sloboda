import { createContext, useContext, useMemo, useState } from "react";
import { PHASE2_ENABLED } from "../app/features";
import { CORE_SECTION_IDS, OPTIONAL_MODULES, readModuleChoice, visibleSectionIds, writeModuleChoice } from "../app/modules";

/** Výber modulov (D-162, D-163) a ich zobrazenie: kontext pre celú appku, zaškrtávacie políčka, blok v Nastaveniach. */

export type ModulesValue = { visible: Set<string>; choice: string[] | null; setChoice: (ids: string[]) => void };
const ModulesCtx = createContext<ModulesValue>({ visible: new Set(CORE_SECTION_IDS), choice: null, setChoice: () => undefined });

/** Výber voliteľných modulov pre celú appku (D-162). Sekcie a navigácia čítajú viditeľnosť odtiaľto. */
export function useModules(): ModulesValue {
  return useContext(ModulesCtx);
}

export function ModulesProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoice] = useState<string[] | null>(readModuleChoice);
  const visible = useMemo(() => visibleSectionIds(choice, PHASE2_ENABLED), [choice]);
  return <ModulesCtx.Provider value={{ visible, choice, setChoice }}>{children}</ModulesCtx.Provider>;
}

/** Zaškrtávacie políčka voliteľných modulov (Sprievodca aj Nastavenia). Jadro sa nezobrazuje, je vždy zapnuté. */
export function ModuleCheckboxes({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string, on: boolean) => {
    const next = on ? [...selected, id] : selected.filter((x) => x !== id);
    onChange(OPTIONAL_MODULES.map((m) => m.id).filter((x) => next.includes(x)));
  };
  return (
    <>
      {OPTIONAL_MODULES.map((m) => (
        <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}>
          <input type="checkbox" checked={selected.includes(m.id)} onChange={(e) => toggle(m.id, e.target.checked)} />
          {m.label}
        </label>
      ))}
    </>
  );
}

/** Nastavenia → Moduly. Vypnutie skryje sekcie; údaje ostanú a výpočty sa nemenia (D-162). */
export function ModulesBlock({ style }: { style?: React.CSSProperties }) {
  const { choice, setChoice } = useModules();
  if (!PHASE2_ENABLED) return null;
  const selected = choice ?? OPTIONAL_MODULES.map((m) => m.id);
  return (
    <section aria-label="Moduly" style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12, ...style }}>
      <h3 style={{ fontSize: "1.05rem" }}>Moduly</h3>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
        Vypnutá sekcia sa skryje. Údaje v nej ostanú uložené a výpočty v appke sa nemenia.
      </p>
      <ModuleCheckboxes
        selected={selected}
        onChange={(ids) => {
          writeModuleChoice(ids);
          setChoice(ids);
        }}
      />
    </section>
  );
}
