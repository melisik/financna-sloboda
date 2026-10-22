import { useEffect } from "react";
import type { Repository } from "../storage/repository";
import type { AppData } from "../storage/types";
import { amortizeLoan, amortizeMortgage } from "../domain/mortgage";
import { investmentsTotalCents } from "../domain/investments";
import { makeCtx } from "../domain/context";
import { autoSnapshot } from "../app/autoEvaluation";
import { todayIso } from "./kit/format";
import { uid } from "./kit/ids";

/** Automatika po zmene dát: automatické vyhodnotenie (D-116) a splácanie hypotéky a úverov (D-137, D-140).
 * Po zápise sa dáta znova načítajú cez reload. Hook je v ui, lebo volá úložisko a patrí k zloženiu appky. */
export function useAutomaticUpdates(repo: Repository | null, data: AppData | null, reload: () => Promise<void>): void {
  // Automatické vyhodnotenie (D-116): po zmene dát sa vytvorí vyhodnotenie za posledný ukončený mesiac, ak ešte nie je.
  // Po uložení sa dáta znova načítajú, a tak sa ďalšie vyhodnotenie nevytvorí, kým nenastane ďalší mesiac.
  useEffect(() => {
    if (!repo || !data || !data.settings) return;
    const ctxNow = makeCtx(data);
    const snap = autoSnapshot({
      latest: ctxNow.latest,
      transactions: data.transactions,
      positionsTotalCents: data.investments.length ? investmentsTotalCents(data.investments) : null,
      realReturn: ctxNow.realReturn,
      today: todayIso(),
      id: uid(),
      now: new Date().toISOString(),
    });
    if (snap) void repo.addSnapshot(snap).then(reload).catch(() => undefined);
  }, [repo, data]);

  // Automatické splácanie hypotéky (D-137): za uplynulé mesiace sa zostatok zníži o istinu; po uložení sa znova načíta.
  useEffect(() => {
    if (!repo || !data) return;
    const today = todayIso();
    const now = new Date().toISOString();
    const propertyUpdates = data.properties.flatMap((p) => {
      const upd = amortizeMortgage(p, today);
      return upd ? [{ ...p, ...upd, updatedAt: now }] : [];
    });
    // Úvery a kreditky (D-140) sa splácajú rovnako ako hypotéka.
    const liabilityUpdates = data.liabilities.flatMap((l) => {
      const upd = amortizeLoan(l.balanceCents, l.rate, l.monthlyPaymentCents, l.balanceDate, today);
      return upd ? [{ ...l, balanceCents: upd.balanceCents, balanceDate: upd.balanceDate, updatedAt: now }] : [];
    });
    if (propertyUpdates.length === 0 && liabilityUpdates.length === 0) return;
    void Promise.all([
      ...propertyUpdates.map((p) => repo.saveProperty(p)),
      ...liabilityUpdates.map((l) => repo.saveLiability(l)),
    ]).then(reload).catch(() => undefined);
  }, [repo, data]);
}
