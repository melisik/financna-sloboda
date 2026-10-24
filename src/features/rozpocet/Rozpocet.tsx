import { useState } from "react";
import type { Repository } from "../../storage/repository";
import { BUDGET_CATEGORIES, type Budget, type Property, type RecurringExpense, type Transaction } from "../../storage/types";
import { budgetStatus, spentInMonthCents } from "../../domain/budget";
import { monthSummary } from "../../domain/monthSummary";
import { monthlyRecurringByCategory } from "../../domain/recurring";
import { housingFlowCents } from "../../domain/property";
import { cents, eur } from "../../ui/kit/format";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { Field, asNum, type NumIn, btnPrimary } from "../../ui/kit/controls";

/** Rozpočet kategórií (D-106): mesačný limit a čo sa za aktuálny mesiac minulo. Prázdny limit = bez rozpočtu. */

export function BudgetSection({ repo, budgets, transactions, recurring, properties, today, onSaved }: { repo: Repository; budgets: Budget[]; transactions: Transaction[]; recurring: RecurringExpense[]; properties: Property[]; today: string; onSaved: () => void }) {
  const [limits, setLimits] = useState<Record<string, NumIn>>(() =>
    Object.fromEntries(BUDGET_CATEGORIES.map((c) => {
      const b = budgets.find((x) => x.category === c);
      return [c, b ? b.limitCents / 100 : ""];
    })),
  );
  const [err, setErr] = useState<string | null>(null);
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
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const recurringByCat = monthlyRecurringByCategory(recurring, today);
  return (
    <section>
      <p style={{ color: "var(--muted)" }}>
        Mesačný limit pre kategóriu. Rozpočet je plán, nie povinnosť: vyplň len kategórie, ktoré chceš sledovať. Prázdny limit znamená bez rozpočtu. Zoznam kategórií je návrh.
      </p>
      {budgets.length === 0 && <p>Zatiaľ nie je nastavený žiadny limit.</p>}
      {plan.planCents > 0 && (
        <p>
          <strong>Plán spolu: {eur(plan.planCents)}</strong> · minuté v kategóriách s limitom: {eur(plan.plannedSpentCents)}
          {plan.percent !== null ? ` (${plan.percent} %)` : ""}
        </p>
      )}
      {BUDGET_CATEGORIES.map((c) => {
        const b = budgets.find((x) => x.category === c);
        // Pravidelné výdavky (D-124) sa rátajú do minutého za mesiac spolu s transakciami v kategórii.
        const rec = recurringByCat[c] ?? 0;
        // Bývanie zahŕňa splátky hypoték mínus nájom (D-137); mimo bývania sa to nerátа.
        const housing = c === "bývanie" ? housingFlowCents(properties) : 0;
        const spent = spentInMonthCents(transactions, c, today) + rec + housing;
        const st = budgetStatus(b, spent);
        const recText = rec > 0 ? ` (z toho pravidelné ${eur(rec)})` : "";
        const hint = st && !st.over
          ? `minuté tento mesiac ${eur(spent)}${recText}; zostáva ${eur(st.remainingCents)}`
          : `minuté tento mesiac ${eur(spent)}${recText}`;
        return (
          <div key={c}>
            <Field
              label={`${c}: limit (€)`}
              value={limits[c] ?? ""}
              onChange={(v) => setLimits({ ...limits, [c]: v })}
              hint={hint}
            />
            {st?.over && <p style={{ color: "var(--danger)", fontSize: "var(--font-small)", margin: "4px 0" }}>Prekročené o {eur(st.remainingCents)}.</p>}
          </div>
        );
      })}
      <p style={{ color: "var(--muted)" }}>Výdavky bez kategórie tento mesiac: {eur(unassigned)}</p>
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btnPrimary}>Uložiť rozpočet</button>
    </section>
  );
}
