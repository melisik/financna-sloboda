/**
 * Dlhé strany, v ktorých sa fotka skúša (v pixeloch), od najväčšej. Malý QR kód na veľkej fotke
 * z telefónu sa pri zmenšení na 1600 px nedá prečítať, preto sa najskôr skúša 3000 px.
 */
const SCAN_SIDES = [3000, 1600];

/** Nájde QR kód na fotke a vráti jeho text, alebo null, ak sa nenašiel. Beží offline. */
export async function readQrFromImage(file: File): Promise<string | null> {
  const { default: jsQR } = await import("jsqr");
  const bitmap = await createImageBitmap(file);
  try {
    for (const maxSide of SCAN_SIDES) {
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(pixels.data, pixels.width, pixels.height);
      if (code) return code.data;
    }
    return null;
  } finally {
    bitmap.close();
  }
}
