import type { Dog, Property } from "./model/entities";
import { DOG_PLACE_LABEL, DOG_PURPOSE_LABEL, activeDogCount } from "./dogs";

/** Tlačivo 17-dp-md (priznanie k dani z nehnuteľností, dani za psa). Umiestnenie v public/ (D-161). */
export const TAX_FORM_PATH = "./tlaciva/17-dp-md.pdf";

/** Polia tlačiva, ktoré sa vyplnia z údajov appky; názvy sú z AcroForm tlačiva (strany 4, 6, 7). */
export interface TaxFormFields {
  text: Record<string, string>;
  checks: string[];
  notes: string[];
}

const DOG_ROWS = 25; // riadkov v oddiele V tlačiva

/** Dátum v tvare dd.mm.rrrr pre tlačivo. */
function skDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

function sqmText(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

/**
 * Mapovanie údajov appky na tlačivo 17-dp-md (D-161). Osobné údaje daňovníka (oddiel I),
 * dátumy vzniku a zániku pri nehnuteľnostiach a ďalšie údaje tlačivo nevypĺňa; používateľ ich doplní v PDF.
 */
export function buildTaxFormFields(properties: Property[], dogs: Dog[], today: string): TaxFormFields {
  const text: Record<string, string> = {};
  const checks: string[] = [];
  const notes: string[] = [];

  const dom = properties.find((p) => p.taxObjectKind === "dom");
  const byt = properties.find((p) => p.taxObjectKind === "byt");
  const extra = properties.filter((p) => p.taxObjectKind !== undefined).length - (dom ? 1 : 0) - (byt ? 1 : 0);
  if (extra > 0) notes.push("Tlačivo pokrýva jednu stavbu a jeden byt. Ďalšie objekty vyplňte na samostatnú prílohu.");

  if (dom) {
    if (dom.taxMunicipality) text["4_Obec"] = dom.taxMunicipality;
    if (dom.cadastralArea) text["4_NazovUzemia"] = dom.cadastralArea;
    if (dom.parcelNumber) text["4_CisloParcely"] = dom.parcelNumber;
    if (dom.buildingNumber) text["4_CisloSupisne"] = dom.buildingNumber;
    if (dom.floorAreaSqm !== undefined) text["4_VymeraPloch"] = sqmText(dom.floorAreaSqm);
    checks.push("4_chbPredmetDane1"); // a) stavby na bývanie a drobné stavby
  }
  if (byt) {
    if (byt.taxMunicipality) text["6_Obec"] = byt.taxMunicipality;
    if (byt.cadastralArea) text["6_NazovUzemia"] = byt.cadastralArea;
    if (byt.parcelNumber) text["6_CisloParcely"] = byt.parcelNumber;
    if (byt.buildingNumber) text["6_CisloSupisne"] = byt.buildingNumber;
    if (byt.flatNumber) text["6_CisloBytu"] = byt.flatNumber;
    if (byt.floorAreaSqm !== undefined) text["6_ZDBytu"] = sqmText(byt.floorAreaSqm);
  }

  const sorted = [...dogs].sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (sorted.length > DOG_ROWS) notes.push(`Tlačivo má ${DOG_ROWS} riadkov pre psov. Ďalších psov vyplňte na prílohu.`);
  sorted.slice(0, DOG_ROWS).forEach((d, i) => {
    const n = i + 1;
    if (d.evidenceNumber) text[`7_EvidCislo${n}`] = d.evidenceNumber;
    text[`7_CisloDomu${n}`] = d.address;
    if (d.age) text[`7_Vek${n}`] = d.age;
    if (d.breed) text[`7_Plemeno${n}`] = d.breed;
    text[`7_MiestoDrzania${n}`] = DOG_PLACE_LABEL[d.keepingPlace];
    text[`7_UcelDrzania${n}`] = DOG_PURPOSE_LABEL[d.purpose];
    text[`7_DatumVzniku${n}`] = skDate(d.startDate);
    if (d.endDate) text[`7_DatumZaniku${n}`] = skDate(d.endDate);
  });
  if (dogs.length > 0) {
    text["7_Obec"] = dogs[0].municipality;
    text["7_ZakladDane"] = String(activeDogCount(dogs, today));
    if (dogs.some((d) => d.holderWithDisability)) checks.push("7_chbDrzitelPreukazu");
    if (dogs.some((d) => d.municipality !== dogs[0].municipality)) notes.push("Psy sú v rôznych obciach. Tlačivo má jedno pole pre obec; ostatné psy doplňte na prílohu.");
  }

  notes.push("Údaje daňovníka (oddiel I), dátumy vzniku a zániku daňovej povinnosti pri nehnuteľnostiach a ďalšie polia doplňte podľa listu vlastníctva a overte podľa tlačiva.");
  return { text, checks, notes };
}
