import { useState } from "react";
import type { Repository } from "../../storage/repository";
import { BUDGET_CATEGORIES, type Budget, type Property, type RecurringExpense, type Transaction } from "../../storage/types";
import { budgetStatus, spentInMonthCents } from "../../domain/budget";
import { monthSummary } from "../../domain/monthSummary";
import { monthlyRecurringByCategory } from "../../domain/recurring";
import { housingFlowCents } from "../../domain/property";
import { cents, eur } from "../../ui/kit/format";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { Field, asNum, type NumIn, btn, btnPrimary, hintStyle } from "../../ui/kit/controls";

/** Rozpočet kategórií (D-106): mesačný limit a čo sa za aktuálny mesiac minulo. Prázdny limit = bez rozpočtu. */

export function BudgetSection({ repo, budgets, transactions, recurring, properties, today, onSaved }: { repo: Repository; budgets: Budget[]; transactions: Transaction[]; recurring: RecurringExpense[]; properties: Property[]; today: string; onSaved: () => void }) {
  const [limits, setLimits] = useState<Record<string, NumIn>>(() =>
    Object.fromEntries(BUDGET_CATEGORIES.map((c) => {
      const b = budgets.find((x) => x.category === c);
      return [c, b ? b.limitCents / 100 : ""];
    })),
  );
  const [err, setErr] = useState<string | null>(null);
  // Polia na limity sú až po „Upraviť limity“; inak je rozpočet prehľad (D-293, docs/46).
  const [editing, setEditing] = useState(false);
  const unassigned = spentInMonthCents(transactions, null, today);
  const plan = monthSummary(transactions, budgets, recurring, today, 0, properties);

  const save = async () => {
    try {
      for (const c of BUDGET_CATEGORIES) {
        const v = limits[c];
        const existing = budgets.find((b) => b.category === c);
        if (v === "" || v === undefined) {
          if (existing) await repo.deleteBudget(c);
          continue;
        }
        const n = asNum(v);
        if (Number.isNaN(n) || n <= 0) return setErr(`Limit pre kategóriu „${c}“ musí byť kladný, alebo prázdny.`);
        await repo.saveBudget({ id: c, category: c, limitCents: cents(n), updatedAt: new Date().toISOString() });
      }
      setErr(null);
      setEditing(false);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const recurringByCat = monthlyRecurringByCategory(recurring, today);
  const rows = BUDGET_CATEGORIES.map((c) => {
    const b = budgets.find((x) => x.category === c);
    // Pravidelné výdavky (D-124) sa rátajú do minutého za mesiac spolu s transakciami v kategórii.
    const rec = recurringByCat[c] ?? 0;
    // Bývanie zahŕňa splátky hypoték mínus nájom (D-137); mimo bývania sa to neráta.
    const housing = c === "bývanie" ? housingFlowCents(properties) : 0;
    const spent = spentInMonthCents(transactions, c, today) + rec + housing;
    return { c, b, rec, spent, st: budgetStatus(b, spent) };
  });
  const recText = (rec: number) => (rec > 0 ? ` (z toho pravidelné ${eur(rec)})` : "");
  const used = rows.filter((r) => r.b || r.spent !== 0);
  const other = rows.filter((r) => !r.b && r.spent === 0);
  const line = (r: (typeof rows)[number]) => (
    <p key={r.c} style={{ margin: "6px 0" }}>
      <strong>{r.c}</strong>: minuté {eur(r.spent)}{recText(r.rec)}
      {r.b && <> · limit {eur(r.b.limitCents)}</>}
      {r.st && !r.st.over && <span style={hintStyle}> · zostáva {eur(r.st.remainingCents)}</span>}
      {r.st?.over && <span style={{ color: "var(--danger)" }}> · prekročené o {eur(r.st.remainingCents)}</span>}
    </p>
  );
  return (
    <section>
      <p style={{ color: "var(--muted)" }}>
        Mesačný limit pre kategóriu. Rozpočet je plán, nie povinnosť: vyplň len kategórie, ktoré chceš sledovať. Prázdny limit znamená bez rozpočtu. Zoznam kategórií je návrh.
      </p>
      {plan.planCents > 0 ? (
        <p>
          <strong>Minuté v kategóriách s limitom: {eur(plan.plannedSpentCents)} z plánu {eur(plan.planCents)}</strong>
          {plan.percent !== null ? ` (${plan.percent} %)` : ""}
        </p>
      ) : (
        <p>Plán ešte nie je nastavený.</p>
      )}
      {editing ? (
        <>
          {rows.map((r) => {
            const hint = r.st && !r.st.over
              ? `minuté tento mesiac ${eur(r.spent)}${recText(r.rec)}; zostáva ${eur(r.st.remainingCents)}`
              : `minuté tento mesiac ${eur(r.spent)}${recText(r.rec)}`;
            return (
              <div key={r.c}>
                <Field label={`${r.c}: limit (€)`} value={limits[r.c] ?? ""} onChange={(v) => setLimits({ ...limits, [r.c]: v })} hint={hint} />
                {r.st?.over && <p style={{ color: "var(--danger)", fontSize: "var(--font-small)", margin: "4px 0" }}>Prekročené o {eur(r.st.remainingCents)}.</p>}
              </div>
            );
          })}
          {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
          <button onClick={save} style={btnPrimary}>Uložiť rozpočet</button>{" "}
          <button onClick={() => { setEditing(false); setErr(null); }} style={btn}>Zrušiť</button>
        </>
      ) : (
        <>
          <h3 style={{ fontSize: "var(--font-text)", marginBottom: 0 }}>Tento mesiac</h3>
          {used.length === 0 ? <p>Tento mesiac zatiaľ nie sú výdavky v kategóriách.</p> : used.map(line)}
          <p style={{ ...hintStyle, margin: "6px 0" }}>Výdavky bez kategórie tento mesiac: {eur(unassigned)}</p>
          {other.length > 0 && (
            <details style={{ margin: "8px 0" }}>
              <summary style={{ ...btn, marginTop: 0, listStyle: "none" }}>Ďalšie kategórie ({other.length}) ▾</summary>
              {other.map(line)}
            </details>
          )}
          <button onClick={() => setEditing(true)} style={btnPrimary}>Upraviť limity</button>
        </>
      )}
    </section>
  );
}
