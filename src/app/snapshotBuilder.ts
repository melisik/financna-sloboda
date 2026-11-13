import type { AppData, Snapshot } from "../domain/model/entities";
import { netPropertyValueCents } from "../domain/property";
import { capitalWithFlagsForToday } from "../domain/ledger";

/**
 * Vytvorí úplný snapshot s K_FIRE, K_nem a K_total (D-116).
 * Používa sa pre automatické aj ručné vyhodnotenie.
 */
export function buildCompleteSnapshot(input: {
  data: AppData;
  date: string; // dátum vyhodnotenia (YYYY-MM-DD)
  isAuto: boolean; // true = automatické, false = ručné
  id: string;
  now: string; // createdAt (ISO timestamp)
  investmentsCents?: number; // K_inv × 100; ak chýba, počítá sa z autoEvaluation
  cashCents?: number; // K_cash × 100; ak chýba, počítá sa z autoEvaluation
}): Snapshot | null {
  const { data, date, isAuto, id, now, investmentsCents, cashCents } = input;

  // Ak nie sú zadané K_inv a K_cash (automatické vyhodnotenie), počítajú sa z transakcií
  let invCents = investmentsCents ?? 0;
  let cashCents_ = cashCents ?? 0;

  // Ak sú K_inv a K_cash zadané ručne, sú to hotové hodnoty
  // Inak musia byť vypočítané z transakcií
  if (investmentsCents === undefined || cashCents === undefined) {
    // Automatické vyhodnotenie: počítaj z transakcií
    const flags = capitalWithFlagsForToday(
      data.snapshots.length > 0
        ? [...data.snapshots].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? null
        : null,
      data.transactions
    );
    invCents = flags.capital.inv;
    cashCents_ = flags.capital.cash;
  }

  const fireCapitalCents = invCents + cashCents_;

  // Vypočítaj K_nem: suma čistých hodnôt všetkých nehnuteľností
  const nemCents = data.properties.reduce((sum, p) => sum + netPropertyValueCents(p), 0);
  const totalCents = fireCapitalCents + nemCents;

  // Rozpis nehnuteľností (podľa špecifikácie)
  const propertyBreakdown = data.properties.map((p) => ({
    propertyId: p.id,
    name: p.name,
    valueCents: p.valueCents,
    mortgageBalanceCents: p.mortgageBalanceCents,
    netValueCents: netPropertyValueCents(p),
  }));

  // Rozpis záväzkov (podľa špecifikácie)
  const liabilityBreakdown = data.liabilities.map((l) => ({
    liabilityId: l.id,
    name: l.name,
    balanceCents: l.balanceCents,
  }));

  // Potvrdenie konzistencie: K_nem = suma čistých hodnôt nehnuteľností (hypotéky sa odpočítavajú, ostatné záväzky nie)
  const propertyValuesSum = data.properties.reduce((sum, p) => sum + p.valueCents, 0);
  const mortgagesSum = data.properties.reduce((sum, p) => sum + p.mortgageBalanceCents, 0);
  const liabilitiesSum = data.liabilities.reduce((sum, l) => sum + l.balanceCents, 0);
  const expectedNetPropertyValue = propertyValuesSum - mortgagesSum;

  if (expectedNetPropertyValue !== nemCents) {
    // Chyba v kalkulácii — zatiaľ log, nestopp (budú staré snapshoty bez K_nem)
    console.warn("[snapshotBuilder] Chyba: K_nem konzistencia", { nemCents, expectedNetPropertyValue });
  }

  return {
    id,
    date,
    investmentsCents: invCents,
    cashCents: cashCents_,
    fireCapitalCents,
    propertyValuesCents: propertyValuesSum,
    liabilitiesCents: liabilitiesSum,
    netPropertyValueCents: nemCents,
    totalNetWorthCents: totalCents,
    propertyBreakdown: propertyBreakdown.length > 0 ? propertyBreakdown : undefined,
    liabilityBreakdown: liabilityBreakdown.length > 0 ? liabilityBreakdown : undefined,
    createdAt: now,
    auto: isAuto ? true : undefined,
  };
}
