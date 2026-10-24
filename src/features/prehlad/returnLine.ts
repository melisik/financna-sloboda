import { nominalFromReal } from "../../domain/assumptions";
import { pctText } from "../../ui/kit/format";

/** Riadok výnosu v Podrobnostiach Prehľadu: uvedená inflácia je tá istá, z ktorej sa počíta nominálny výnos (D-263, D-282). */
export function returnLine(realReturn: number, inflation: number): string {
  return `Výnos: ${pctText(realReturn)} reálne po poplatkoch, nominálne ≈ ${pctText(nominalFromReal(realReturn, inflation))} pri inflácii ${pctText(inflation)} (predpoklad).`;
}
