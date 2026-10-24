import { weeklySummary } from "../../domain/weekly";
import { dateSk, eur } from "../../ui/kit/format";

type Summary = ReturnType<typeof weeklySummary>;

/** Riadky textového týždenného súhrnu (N-10, D-155). Rovnaké pre uložený súbor aj pre mail; výstraha sa líši podľa kanála. */
export function weeklySummaryLines(s: Summary, channel: "subor" | "mail" = "subor"): string[] {
  return [
    "Týždenný súhrn výdavkov",
    `Obdobie: ${dateSk(s.fromIso)} – ${dateSk(s.toIso)}`,
    `Výdavky spolu: ${eur(s.totalCents)}`,
    `Počet zápisov: ${s.count}`,
    `Nad prahom: ${s.overThresholdCount}`,
    "",
    "Podľa kategórií:",
    ...(s.byCategory.length === 0 ? ["(žiadne výdavky)"] : s.byCategory.map((c) => `- ${c.category}: ${eur(c.cents)}`)),
    "",
    "Súhrn je len prehľad zadaných údajov, nie finančné poradenstvo.",
    channel === "subor" ? "Obsahuje finančné údaje: neukladaj ho do verejných priečinkov." : "Obsahuje finančné údaje: over, komu ho posielaš.",
  ];
}

/**
 * Odkaz mailto (N-10, D-277): predvyplní predmet a text. Príjemcu a odoslanie rieši mailová aplikácia;
 * appka nič neposiela a nič neukladá.
 */
export function weeklyMailto(s: Summary): string {
  const subject = `Týždenný súhrn výdavkov ${dateSk(s.fromIso)} – ${dateSk(s.toIso)}`;
  const body = weeklySummaryLines(s, "mail").join("\n");
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
