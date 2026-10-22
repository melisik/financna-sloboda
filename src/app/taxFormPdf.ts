import type { TaxFormFields } from "../domain/taxForm";

/**
 * Vyplnenie editovateľného tlačiva 17-dp-md (D-161). Knižnica sa načíta až pri použití.
 * Vracia PDF, polia, ktoré tlačivo nemá (chyba názvu), a polia, do ktorých sa hodnota nezmestila
 * (napr. komb s obmedzenou dĺžkou). Také hodnoty sa nezapisujú skrátene; používateľ ich doplní ručne.
 */
export async function fillTaxFormPdf(
  template: Uint8Array,
  fields: TaxFormFields,
): Promise<{ bytes: Uint8Array; missing: string[]; tooLong: string[] }> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(template);
  const form = doc.getForm();
  const missing: string[] = [];
  const tooLong: string[] = [];
  for (const [name, value] of Object.entries(fields.text)) {
    let field;
    try {
      field = form.getTextField(name);
    } catch {
      missing.push(name);
      continue;
    }
    try {
      field.setText(value);
    } catch {
      tooLong.push(name);
    }
  }
  for (const name of fields.checks) {
    try {
      form.getCheckBox(name).check();
    } catch {
      missing.push(name);
    }
  }
  return { bytes: await doc.save(), missing, tooLong };
}
