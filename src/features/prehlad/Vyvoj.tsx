import type { AppData } from "../../storage/types";
import type { Ctx } from "../../domain/context";
import { annualOverview, type OverviewSettings } from "../../domain/annualOverview";
import { historyShift } from "../../domain/progressHistory";
import { LineChart } from "../../ui/kit/LineChart";
import { btn, hintStyle } from "../../ui/kit/controls";
import { dateSk, eur } from "../../ui/kit/format";
import { goalCell, historyLine } from "./progressText";

const mmYyyy = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const cell = { textAlign: "left" as const, padding: "4px 6px", borderBottom: "1px solid var(--border-soft)" };

/**
 * Vývoj v čase na Prehľade (D-289, docs/44: U1, A, N1). Zbalený, otvára ho používateľ (`docs/00`, riziko stresu).
 * Riadky sú z `annualOverview`, rovnako ako Ročný prehľad: len minulé vyhodnotenia, žiadna projekcia (D-008).
 */
export function VyvojBlock({ data, ctx }: { data: AppData; ctx: Ctx }) {
  const s: OverviewSettings | null =
    ctx.settings && ctx.target !== null ? { target: ctx.target, realReturn: ctx.realReturn, mInv: ctx.mInv, mCash: ctx.mCash } : null;
  const rows = annualOverview(data.snapshots, s, data.transactions, ctx.rentals);
  const shift = historyShift(rows);
  const first = rows[0];
  const last = rows[rows.length - 1];
  return (
    <details style={{ marginTop: 8 }}>
      <summary style={{ ...btn, marginTop: 0, listStyle: "none" }}>Vývoj ▾</summary>
      {rows.length < 2 ? (
        <p>Vývoj sa ukáže po druhom vyhodnotení.</p>
      ) : (
        <>
          <h3 style={{ fontSize: "var(--font-text)", margin: "12px 0 4px" }}>Kapitál pri vyhodnotení</h3>
          <LineChart
            values={rows.map((r) => r.totalCents)}
            reference={s ? s.target : null}
            referenceLabel={s ? `cieľová suma ${eur(s.target)}` : undefined}
            startLabel={mmYyyy(first.date)}
            endLabel={mmYyyy(last.date)}
            lastLabel={eur(last.totalCents)}
            label={`Kapitál pri vyhodnotení od ${dateSk(first.date)} do ${dateSk(last.date)}: z ${eur(first.totalCents)} na ${eur(last.totalCents)}${s ? `; cieľová suma ${eur(s.target)}` : ""}.`}
          />
          {shift && <p>{historyLine(shift)}</p>}
          <p style={hintStyle}>
            Kapitál sú investície a hotovosť z vyhodnotení.{s ? " Dátumy cieľa sú prepočítané s dnešnými nastaveniami." : ""} Body sú vyhodnotenia v poradí, nie časová os. Je to minulosť, nie odhad budúcnosti.
          </p>
          {ctx.rentals.length > 0 && (
            <p style={hintStyle}>Graf ukazuje investície a hotovosť. Nehnuteľnosti v prenájme v ňom nie sú, lebo ich minulé hodnoty sa neukladajú; pokrok na Prehľade ich zahŕňa.</p>
          )}
          <details style={{ marginTop: 8 }}>
            <summary style={{ ...btn, marginTop: 0, listStyle: "none" }}>Tabuľka ▾</summary>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "var(--font-small)", marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={cell}>Vyhodnotenie</th>
                  <th style={cell}>Kapitál</th>
                  {s && <th style={cell}>Dátum cieľa</th>}
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => (
                  <tr key={r.date}>
                    <td style={cell}>{dateSk(r.date)}</td>
                    <td style={cell}>{eur(r.totalCents)}</td>
                    {s && <td style={cell}>{goalCell(r.goal)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </details>
  );
}
