import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType } from "@zxing/library";
import { isValidBarcode } from "../../domain/stock";

/** Najdlhšia strana fotky pre čítanie kódu: menšia fotka sa dekóduje rýchlo a čiarový kód je stále čitateľný (D-232). */
const MAX_SIDE = 1200;

/** Čítač EAN-13, EAN-8 a UPC-A (D-232). Používa ho fotka aj živá kamera. */
export function createBarcodeReader(): BrowserMultiFormatReader {
  const hints = new Map<DecodeHintType, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A]],
    [DecodeHintType.TRY_HARDER, true],
  ]);
  return new BrowserMultiFormatReader(hints);
}

/** Čítanie čiarového kódu z fotky obalu (D-232): offline, bez siete. Vráti číslice alebo undefined. */
export async function readBarcode(file: File): Promise<string | undefined> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    // data: URL, lebo CSP appky povoľuje obrázky len z 'self' a data: (blob: by sa nenačítal).
    const result = await createBarcodeReader().decodeFromImageUrl(canvas.toDataURL("image/png"));
    const text = result.getText();
    return isValidBarcode(text) ? text : undefined;
  } catch {
    return undefined;
  }
}
