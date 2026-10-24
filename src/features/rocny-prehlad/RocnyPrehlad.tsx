import type { AppData } from "../../storage/types";
import type { Ctx } from "../../domain/context";
import { annualOverview, categoryComparison, yearlySummary, type OverviewSettings } from "../../domain/annualOverview";
import { plural } from "../../domain/impact";
import { goalDateText } from "../../domain/goalText";
import { dateSk, eur, monthYear, todayIso } from "../../ui/kit/format";
import { NextStep } from "../../ui/kit/NextStep";

/** Zmena dátumu cieľa v mesiacoch, slovne (docs/13, oddiel 4). */
function goalShiftText(d: number): string {
  if (d === 0) return "bez zmeny";
  const k = Math.abs(d);
  return `o ${k} ${plural(k, "mesiac", "mesiace", "mesiacov")} ${d < 0 ? "skôr" : "neskôr"}`;
}

/** Ročný prehľad (docs/13, oddiel 4): história K a dátumu cieľa medzi vyhodnoteniami. Len zobrazenie. */
export function RocnyPrehladSection({ data, ctx }: { data: AppData; ctx: Ctx }) {
  const s: OverviewSettings | null =
    ctx.settings && ctx.target !== null ? { target: ctx.target, realReturn: ctx.realReturn, mInv: ctx.mInv, mCash: ctx.mCash } : null;
  const rows = annualOverview(data.snapshots, s, data.transactions, ctx.rentals);
  const years = yearlySummary(data.snapshots, data.transactions);
  if (rows.length === 0) return <p>Zatiaľ nie sú vyhodnotenia. Prehľad sa zobrazí po prvom vyhodnotení. <NextStep to="vyhodnotenie">Vyhodnotenie</NextStep></p>;
  const savingZero = ctx.mInv + ctx.mCash === 0;
  // N-11: porovnanie kategórií za rovnaké obdobie; ak je najnovší rok aktuálny, len mesiace do dneška.
  // Riadky vznikajú zo snapshotov (aspoň jeden tu je), preto je latestYear konečné.
  const latestYear = Math.max(...data.transactions.map((x) => Number(x.date.slice(0, 4))), ...data.snapshots.map((x) => Number(x.date.slice(0, 4))));
  const today = todayIso();
  const throughMonth = latestYear === Number(today.slice(0, 4)) ? Number(today.slice(5, 7)) : 12;
  const comparison = categoryComparison(data.transactions, latestYear, latestYear - 1, throughMonth);
  return (
    <div>
      <p style={{ color: "var(--muted)" }}>Vyhodnotenia od najstaršieho. Dátum cieľa sa počíta z uloženého K a z aktuálnych Nastavení, bez nehnuteľností.</p>
      {!s && <p style={{ color: "var(--muted)" }}>Nastavenia nie sú zadané; zobrazí sa len K. <NextStep to="nastavenia">Nastavenia</NextStep></p>}
      <h3 style={{ fontSize: "1rem", marginTop: 16 }}>Výdavky podľa kategórií</h3>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: 0 }}>
        {latestYear - 1} a {latestYear}{throughMonth < 12 ? `, mesiace 1 až ${throughMonth}` : ""}. Porovnanie je za rovnaké obdobie.
      </p>
      {comparison.length === 0 ? (
        <p>Zatiaľ nie sú výdavky na porovnanie.</p>
      ) : (
        <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          {comparison.map((c) => (
            <p key={c.category} style={{ margin: "4px 0" }}>
              <strong>{c.category}</strong>: {eur(c.curCents)} (minulý rok {eur(c.prevCents)}, zmena {c.diffCents >= 0 ? "+" : "−"}{eur(Math.abs(c.diffCents))})
            </p>
          ))}
        </div>
      )}
      <h3 style={{ fontSize: "1rem", marginTop: 16 }}>Súhrn po rokoch</h3>
      {years.map((y) => (
        <div key={y.year} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{y.year}</strong></p>
          {y.endK !== null && (
            <p style={{ margin: "4px 0" }}>
              K na konci roka: {eur(y.endK)}
              {y.deltaK !== null ? ` (zmena za rok ${y.deltaK >= 0 ? "+" : "−"}${eur(Math.abs(y.deltaK))})` : ""}
            </p>
          )}
          <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>Sporenie: {eur(y.sporenieCents)} · výdavky celkom: {eur(y.vydavkyCents)}</p>
          {y.topCategory && (
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Najviac sa minulo na: {y.topCategory.name} ({eur(y.topCategory.cents)})</p>
          )}
        </div>
      ))}
      <h3 style={{ fontSize: "1rem", marginTop: 16 }}>Vyhodnotenia</h3>
      {rows.map((r) => (
        <div key={r.date} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{dateSk(r.date)}</strong>{r.auto ? " · automaticky" : ""}</p>
          <p style={{ margin: "4px 0" }}>K: {eur(r.totalCents)} (investície {eur(r.invCents)}, hotovosť {eur(r.cashCents)})</p>
          {r.deltaTotalCents !== null && (
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
              Zmena K: {r.deltaTotalCents >= 0 ? "+" : "−"}{eur(Math.abs(r.deltaTotalCents))}
            </p>
          )}
          {r.sporenieCents !== null && r.vydavkyCents !== null && r.ostatneCents !== null && (
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
              z toho sporenie {eur(r.sporenieCents)}, výdavky −{eur(r.vydavkyCents)}
              {r.rezervaCents !== null && r.rezervaCents !== 0 && <>, rezerva {r.rezervaCents >= 0 ? "+" : "−"}{eur(Math.abs(r.rezervaCents))}</>}
              , výnos a ostatné {r.ostatneCents >= 0 ? "+" : "−"}{eur(Math.abs(r.ostatneCents))}
            </p>
          )}
          {r.goal && <p style={{ margin: "4px 0" }}>Dátum cieľa: <strong>{goalDateText(r.goal, savingZero, monthYear)}</strong></p>}
          {r.deltaGoalMonths !== null && (
            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>Zmena dátumu cieľa: {goalShiftText(r.deltaGoalMonths)}</p>
          )}
        </div>
      ))}
    </div>
  );
}
