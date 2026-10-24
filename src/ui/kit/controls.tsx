/** Spoločné ovládacie prvky: pole s hintom, tlačidlo, nadpis sekcie (D-144, D-166). Bez väzby na konkrétnu sekciu. */
import type { CSSProperties, ReactNode } from "react";

/** Číselné pole môže byť prázdne (NaN); validácia pri uložení (R11). */
export type NumIn = number | "";
export const asNum = (x: NumIn) => (x === "" ? NaN : x);

export const inp: CSSProperties = { width: "100%", padding: "8px", fontSize: "var(--font-text)", boxSizing: "border-box" };

/** Tlačidlo: rámik, text s väčším písmom a výška aspoň 44 px (dotyková plocha). */
export const btn: CSSProperties = {
  minHeight: 44, boxSizing: "border-box", padding: "8px 14px", fontSize: "var(--font-text)", fontWeight: 600, marginTop: 8,
  border: "1px solid var(--border-strong)", borderRadius: 6, background: "var(--surface)", color: "var(--text)",
  textDecoration: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-start",
};
/** Hlavná akcia obrazovky (uloženie, pridanie). */
export const btnPrimary: CSSProperties = { ...btn, background: "var(--primary-bg)", color: "var(--primary-text)", borderColor: "var(--primary-bg)" };
/** Zmazanie: červený rámik a text. Pred zmazaním sa vždy pýta potvrdenie. */
export const btnDanger: CSSProperties = { ...btn, color: "var(--danger)", borderColor: "var(--danger)" };

export function Field(props: { label: string; value: NumIn | string; onChange: (v: any) => void; step?: number; type?: string; inputMode?: "numeric" | "text"; max?: string; maxLength?: number; hint?: string; onReset?: () => void; changed?: boolean }) {
  const textual = props.type === "text" || props.type === "date" || props.type === "password";
  return (
    <label style={{ display: "block", margin: "8px 0" }}>
      <span style={{ display: "block", fontSize: "var(--font-small)" }}>{props.label}</span>
      <input
        type={props.type ?? "number"}
        inputMode={props.inputMode}
        max={props.max}
        maxLength={props.maxLength}
        step={props.step ?? 1}
        value={props.value}
        onChange={(e) => {
          if (textual) return props.onChange(e.target.value);
          props.onChange(e.target.value === "" ? "" : Number(e.target.value));
        }}
        style={inp}
      />
      {props.hint && (
        <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.85rem", color: "var(--muted)" }}>
          {props.hint}
          {props.onReset && props.changed && (
            <button type="button" onClick={props.onReset} style={{ ...btn, padding: "2px 8px", fontSize: "0.85rem", marginTop: 0 }}>
              Vrátiť východiskovú hodnotu
            </button>
          )}
        </span>
      )}
    </label>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} style={{ background: "var(--page)", padding: 16, borderRadius: 8, marginBottom: 12 }}>
      <h2 style={{ fontSize: "var(--font-heading)", marginTop: 0, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--border-soft)" }}>{title}</h2>
      {children}
    </section>
  );
}

/** Hodnota poľa sa líši od východiskovej (FR-13): tlačidlo „vrátiť“ sa ukáže len vtedy. */
export function differs(value: NumIn | string, defaultValue: number | null): boolean {
  if (value === "" || Number.isNaN(value as number)) return false; // nezadané: výzva je v nápovede, nie tlačidlo
  if (defaultValue === null) return true; // prepísané pole bez východiskovej hodnoty
  return Math.abs(Number(value) - defaultValue) > 1e-9;
}

/**
 * Pomocný odkaz: bez rámika, aby nekonkuroval hlavnej akcii. Dotyková výška aspoň 44 px (docs/39).
 * Záporný zvislý okraj: v riadku textu nezväčší výšku riadku, dotyková plocha zostane 44 px.
 */
export const btnLink: CSSProperties = {
  minHeight: 44, boxSizing: "border-box", marginTop: -10, marginBottom: -10, padding: "8px 4px", fontSize: "var(--font-text)", color: "var(--link)", textDecoration: "underline",
  background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", alignSelf: "flex-start",
};
/** Karta: rámik a pozadie pre skupinu údajov na obrazovke. */
export const card: CSSProperties = { border: "1px solid var(--border)", padding: 12, borderRadius: 6, background: "var(--surface)" };
/** Pomocný a muted text (vysvetlivky, poznámky pod nadpisom). */
export const hintStyle: CSSProperties = { color: "var(--muted)", fontSize: "var(--font-small)" };

export type Tone = "info" | "warn" | "ok" | "error";
const TONE_BG: Record<Tone, string> = { info: "var(--surface)", warn: "var(--warn-bg)", ok: "var(--ok-bg)", error: "var(--err-bg)" };
const TONE_BORDER: Record<Tone, string> = { info: "var(--border-strong)", warn: "var(--warn-border)", ok: "var(--ok)", error: "var(--danger)" };
/** Štýl upozornenia: pozadie podľa tónu, ľavý okraj farbou tónu, text vždy v hlavnej farbe. */
export function calloutStyle(tone: Tone): CSSProperties {
  return { background: TONE_BG[tone], borderLeft: `4px solid ${TONE_BORDER[tone]}`, padding: 12, borderRadius: 6, margin: "8px 0", color: "var(--text)" };
}
/** Upozornenie ako komponent (nové miesta). Existujúce miesta používajú calloutStyle, aby sa zachovali roly. */
export function Callout({ tone = "info", role, children }: { tone?: Tone; role?: "alert" | "note" | "status"; children: ReactNode }) {
  return <div role={role} style={calloutStyle(tone)}>{children}</div>;
}
