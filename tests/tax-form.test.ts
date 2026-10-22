import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PDFDocument, PDFTextField } from "pdf-lib";
import { buildTaxFormFields } from "../src/domain/taxForm";
import { fillTaxFormPdf } from "../src/features/dane/taxFormPdf";
import type { Dog, Property } from "../src/storage/types";

// Vyplnenie tlačiva 17-dp-md (D-161). Syntetické hodnoty; tlačivo je z public/tlaciva/.
const TODAY = "2026-10-22";
// Načítanie a uloženie 1 MB PDF s 1 600 poľami trvá niekoľko sekúnd; pri paralelnom behu na pomalšom stroji treba väčšiu rezervu (Windows, audit 2026-10-22).
const SLOW = 60_000;
const TEMPLATE = readFileSync(join(__dirname, "..", "public", "tlaciva", "17-dp-md.pdf"));

const dom: Property = {
  id: "p1", mode: "vlastne_byvanie", valueCents: 0, valueDate: TODAY, mortgageBalanceCents: 0,
  taxObjectKind: "dom", taxMunicipality: "Testovacia obec", cadastralArea: "Testovo k. ú.",
  parcelNumber: "123/4", buildingNumber: "55", floorAreaSqm: 120.5, createdAt: "x", updatedAt: "x",
};
const byt: Property = {
  id: "p2", mode: "prenajom", valueCents: 0, valueDate: TODAY, mortgageBalanceCents: 0,
  taxObjectKind: "byt", taxMunicipality: "Iná obec", cadastralArea: "Iné k. ú.", parcelNumber: "9",
  buildingNumber: "7", flatNumber: "12", floorAreaSqm: 48, createdAt: "x", updatedAt: "x",
};
const dog: Dog = {
  id: "d1", municipality: "Testovacia obec", address: "Hlavná 1", keepingPlace: "byt", purpose: "domaci",
  startDate: "2025-03-01", holderWithDisability: true, createdAt: "x", updatedAt: "x",
};

async function readBack(bytes: Uint8Array): Promise<Record<string, string>> {
  const form = (await PDFDocument.load(bytes)).getForm();
  const out: Record<string, string> = {};
  for (const f of form.getFields()) {
    if (f instanceof PDFTextField) out[f.getName()] = form.getTextField(f.getName()).getText() ?? "";
  }
  return out;
}

describe("tlačivo 17-dp-md (D-161)", () => {
  it("všetky polia z mapovania existujú v tlačive", async () => {
    const fields = buildTaxFormFields([dom, byt], [dog], TODAY);
    const { missing } = await fillTaxFormPdf(new Uint8Array(TEMPLATE), fields);
    expect(missing).toEqual([]);
  }, SLOW);

  it("hodnota, ktorá sa nezmestí do poľa, sa nezapíše a nahlási sa ako tooLong", async () => {
    // 4_NazovUzemia má v tlačive najviac 15 znakov.
    const fields = buildTaxFormFields([{ ...dom, cadastralArea: "Veľmi dlhé k. ú. Testovo" }], [], TODAY);
    const { missing, tooLong, bytes } = await fillTaxFormPdf(new Uint8Array(TEMPLATE), fields);
    expect(missing).toEqual([]);
    expect(tooLong).toEqual(["4_NazovUzemia"]);
    expect((await readBack(bytes))["4_NazovUzemia"]).toBe("");
  }, SLOW);

  it("hodnoty sa zapíšu do správnych polí", async () => {
    const fields = buildTaxFormFields([dom, byt], [dog], TODAY);
    const { bytes } = await fillTaxFormPdf(new Uint8Array(TEMPLATE), fields);
    const back = await readBack(bytes);
    expect(back["4_Obec"]).toBe("Testovacia obec");
    expect(back["4_VymeraPloch"]).toBe("120,50");
    expect(back["6_CisloBytu"]).toBe("12");
    expect(back["6_ZDBytu"]).toBe("48,00");
    expect(back["7_CisloDomu1"]).toBe("Hlavná 1");
    expect(back["7_DatumVzniku1"]).toBe("01.03.2025");
    expect(back["7_ZakladDane"]).toBe("1");
    expect(back["7_Obec"]).toBe("Testovacia obec");
  }, SLOW);

  it("zaškrtnutie predmetu dane a držiteľa preukazu sa prenesie", async () => {
    const fields = buildTaxFormFields([dom], [dog], TODAY);
    expect(fields.checks).toEqual(["4_chbPredmetDane1", "7_chbDrzitelPreukazu"]);
    const { bytes } = await fillTaxFormPdf(new Uint8Array(TEMPLATE), fields);
    const form = (await PDFDocument.load(bytes)).getForm();
    expect(form.getCheckBox("4_chbPredmetDane1").isChecked()).toBe(true);
    expect(form.getCheckBox("7_chbDrzitelPreukazu").isChecked()).toBe(true);
  }, SLOW);

  it("bez údajov tlačivo nevyplní nič a nevytvorí poznámky o psoch", () => {
    const fields = buildTaxFormFields([], [], TODAY);
    expect(fields.text).toEqual({});
    expect(fields.checks).toEqual([]);
    expect(fields.notes.length).toBe(1);
  });

  it("psy v rôznych obciach a viac objektov sa upozornia v poznámkach", () => {
    const fields = buildTaxFormFields([dom, byt, { ...dom, id: "p3", taxObjectKind: "dom" }], [dog, { ...dog, id: "d2", municipality: "Iná" }], TODAY);
    expect(fields.notes.join(" ")).toMatch(/jednu stavbu a jeden byt/);
    expect(fields.notes.join(" ")).toMatch(/rôznych obciach/);
  });
});
