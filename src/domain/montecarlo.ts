/** Monte Carlo simulácie GBM (D-341). Čistá doménová logika bez UI a bez workerov. */

export interface MCSettings {
  initialCapitalCents: number;
  monthlyWithdrawalCents: number;
  meanAnnualReturn: number;
  volatility: number; // smerodajná odchýlka ročného výnosu; predvolene 0.15
  yearsToSimulate: number;
}

export interface MCResult {
  percentile5th: number[]; // pole kapitálu v čase – pesimistický scenár
  percentile50th: number[]; // medián
  percentile95th: number[]; // optimistický scenár
  successRate: number; // podiel behov, kde kapitál nepadol na 0
}

/** Jedno kolo GBM: pole mesačných hodnôt kapitálu. Vracia true ak kapitál vydržal celú dobu. */
function runSingle(s: MCSettings, steps: number): { values: number[]; survived: boolean } {
  const dt = 1 / 12;
  const mu = s.meanAnnualReturn;
  const sigma = s.volatility;
  let capital = s.initialCapitalCents;
  const values: number[] = [capital];
  for (let i = 0; i < steps; i++) {
    // Štandardné normálne číslo cez Box-Muller
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1 === 0 ? 1e-10 : u1)) * Math.cos(2 * Math.PI * u2);
    const factor = Math.exp((mu - (sigma * sigma) / 2) * dt + sigma * Math.sqrt(dt) * z);
    capital = Math.max(0, capital * factor - s.monthlyWithdrawalCents);
    values.push(capital);
  }
  return { values, survived: capital > 0 };
}

function percentileAt(sorted: number[], p: number): number {
  const idx = Math.floor(p * (sorted.length - 1));
  return sorted[idx];
}

/** Spustí `iterations` GBM behov a vráti percentily a úspešnosť. */
export function runMonteCarlo(s: MCSettings, iterations = 1000): MCResult {
  const steps = s.yearsToSimulate * 12;
  const allValues: number[][] = [];
  let survived = 0;
  for (let i = 0; i < iterations; i++) {
    const r = runSingle(s, steps);
    allValues.push(r.values);
    if (r.survived) survived++;
  }
  const byStep: number[][] = Array.from({ length: steps + 1 }, (_, t) =>
    allValues.map((v) => v[t]).sort((a, b) => a - b)
  );
  return {
    percentile5th: byStep.map((s) => percentileAt(s, 0.05)),
    percentile50th: byStep.map((s) => percentileAt(s, 0.5)),
    percentile95th: byStep.map((s) => percentileAt(s, 0.95)),
    successRate: survived / iterations,
  };
}
