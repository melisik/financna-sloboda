import { createWorker } from "tesseract.js";

/**
 * Príprava fotky pre OCR: sivá škála, natiahnutý kontrast (slabé svetlo) a zväčšenie malých fotiek.
 * Text na obale je pre rozpoznávač čitateľnejší, ak má aspoň ~1600 px na dlhšej strane.
 */
async function prepareImage(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(2, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("canvas");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const d = pixels.data;
  const gray = new Uint8ClampedArray(canvas.width * canvas.height);
  const histogram = new Array(256).fill(0);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    gray[p] = g;
    histogram[g]++;
  }
  // Orez 1 % najtmavších a najsvetlejších pixelov, aby odlesky a tiene nezhoršili rozsah.
  const total = gray.length;
  let low = 0, high = 255, acc = 0;
  for (let v = 0; v < 256; v++) { acc += histogram[v]; if (acc >= total * 0.01) { low = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += histogram[v]; if (acc >= total * 0.01) { high = v; break; } }
  const span = Math.max(1, high - low);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const v = Math.min(255, Math.max(0, Math.round(((gray[p] - low) * 255) / span)));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
}

/**
 * Rozpoznanie textu z fotky obalu. Všetko beží v prehliadači: worker, jadro aj slovenské dáta sú v appke (public/),
 * bez volaní na externé služby (FR-16).
 */
export async function recognizeImage(file: File): Promise<string> {
  const base = import.meta.env.BASE_URL;
  const worker = await createWorker("slk", 1, {
    workerPath: `${base}tesseract/worker.min.js`,
    workerBlobURL: false, // worker z vlastného súboru (CSP worker-src 'self', bez blob:)
    corePath: `${base}tesseract/`,
    langPath: `${base}tessdata/`,
    gzip: true,
    logger: () => undefined,
  });
  try {
    const { data } = await worker.recognize(await prepareImage(file));
    return data.text;
  } finally {
    await worker.terminate();
  }
}
