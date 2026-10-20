import { createWorker } from "tesseract.js";

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
    const { data } = await worker.recognize(file);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
