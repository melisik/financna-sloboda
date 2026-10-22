/** Spoločné ovládacie prvky: pole s hintom, tlačidlo, nadpis sekcie (D-144, D-166). Bez väzby na konkrétnu sekciu. */
import type { CSSProperties, ReactNode } from "react";

/** Číselné pole môže byť prázdne (NaN); validácia pri uložení (R11). */
export type NumIn = number | "";
export const asNum = (x: NumIn) => (x === "" ? NaN : x);

export const inp: CSSProperties = { width: "100%", padding: "8px", fontSize: "1rem", boxSizing: "border-box" };

export const btn: CSSProperties = { padding: "8px 14px", fontSize: "1rem", marginTop: 8 };

export function Field(props: { label: string; value: NumIn | string; onChange: (v: any) => void; step?: number; type?: string; inputMode?: "numeric" | "text"; max?: string; hint?: string; onReset?: () => void; changed?: boolean }) {
  const textual = props.type === "text" || props.type === "date" || props.type === "password";
  return (
    <label style={{ display: "block", margin: "8px 0" }}>
      <span style={{ display: "block", fontSize: "0.9rem" }}>{props.label}</span>
      <input
        type={props.type ?? "number"}
        inputMode={props.inputMode}
        max={props.max}
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
      <h2 style={{ fontSize: "1.25rem", marginTop: 0, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid var(--border-soft)" }}>{title}</h2>
      {children}
    </section>
  );
}
