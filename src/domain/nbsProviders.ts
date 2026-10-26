/**
 * Výber priamych poskytovateľov investičných produktov z registra subjektov finančného trhu NBS (D-329, docs/63).
 * Čistá funkcia pre skript `scripts/nbs-providers.mts`; appka sama register nevolá (D-009). Názvy a IČO sa preberajú
 * doslovne (podmienky NBS: súbor sa nesmie pozmeňovať, docs/64). Agenti a sprostredkovatelia sa nepreberajú.
 */
export interface NbsLicense { scope: string; valid_from?: string; licenses?: NbsLicense[] }
export interface NbsInstitution { id: string; name: string; address: string; country: string; licenses: NbsLicense[] }
export interface Provider { ico: string; name: string; type: string }

const INVESTMENT_SERVICES = "poskytovanie investičných služieb";

/** Poradie je poradie dôležitosti typu, keď má firma viac oprávnení. */
const TYPES: { scope: string; type: string; needsInvestmentServices?: boolean }[] = [
  { scope: "obchodník s cennými papiermi", type: "obchodník s cennými papiermi" },
  { scope: "pobočka zahraničného obchodníka s cennými papiermi", type: "obchodník s cennými papiermi" },
  { scope: "správcovská spoločnosť", type: "správcovská spoločnosť" },
  { scope: "pobočka zahraničnej správcovskej spoločnosti", type: "správcovská spoločnosť" },
  { scope: "banka, úverová inštitúcia", type: "banka", needsInvestmentServices: true },
  { scope: "pobočka zahraničnej banky", type: "banka", needsInvestmentServices: true },
  { scope: "dôchodková správcovská spoločnosť", type: "dôchodková spoločnosť (II. pilier)" },
  { scope: "doplnková dôchodková spoločnosť", type: "doplnková dôchodková spoločnosť (III. pilier)" },
  { scope: "poisťovňa", type: "poisťovňa" },
  { scope: "pobočka poisťovne z iného členského štátu", type: "poisťovňa" },
  { scope: "poskytovateľ služieb kryptoaktív", type: "kryptoaktíva" },
  { scope: "poskytovateľ služieb hromadného financovania", type: "hromadné financovanie" },
];
export const PROVIDER_TYPE_ORDER: string[] = [...new Set(TYPES.map((t) => t.type))];

export function selectProviders(institutions: NbsInstitution[]): Provider[] {
  const out: Provider[] = [];
  for (const i of institutions) {
    for (const t of TYPES) {
      const lic = i.licenses.find((l) => l.scope === t.scope);
      if (!lic) continue;
      if (t.needsInvestmentServices && !(lic.licenses ?? []).some((n) => n.scope === INVESTMENT_SERVICES)) continue;
      out.push({ ico: i.id, name: i.name, type: t.type });
      break;
    }
  }
  const collator = new Intl.Collator("sk");
  return out.sort((a, b) => PROVIDER_TYPE_ORDER.indexOf(a.type) - PROVIDER_TYPE_ORDER.indexOf(b.type) || collator.compare(a.name.trim(), b.name.trim()));
}
