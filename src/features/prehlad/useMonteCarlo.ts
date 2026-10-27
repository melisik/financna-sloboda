import { useEffect, useRef, useState } from "react";
import type { MCSettings, MCResult } from "../../domain/montecarlo";

/** Hook: spúšťa Monte Carlo simuláciu vo Web Workeri (D-341). */
export function useMonteCarlo(settings: MCSettings | null): { result: MCResult | null; running: boolean } {
  const [result, setResult] = useState<MCResult | null>(null);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!settings) return;
    if (workerRef.current) workerRef.current.terminate();
    const worker = new Worker(new URL("../../workers/montecarlo.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    setRunning(true);
    worker.onmessage = (e: MessageEvent<MCResult>) => {
      setResult(e.data);
      setRunning(false);
    };
    worker.postMessage(settings);
    return () => { worker.terminate(); };
  }, [
    settings?.initialCapitalCents,
    settings?.monthlyWithdrawalCents,
    settings?.meanAnnualReturn,
    settings?.volatility,
    settings?.yearsToSimulate,
  ]);

  return { result, running };
}
