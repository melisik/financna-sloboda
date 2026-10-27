/** Monte Carlo Web Worker (D-341): spúšťa GBM simulácie mimo hlavného vlákna. */
import { runMonteCarlo, type MCSettings, type MCResult } from "../domain/montecarlo";

self.onmessage = (e: MessageEvent<MCSettings>) => {
  const result: MCResult = runMonteCarlo(e.data, 1000);
  self.postMessage(result);
};
