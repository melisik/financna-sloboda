/** Ukladanie súborov z appky: zdieľací list na iPhone, inak stiahnutie (D-161). Bez väzby na doménu. */

/** Ako sa súbor uložil: cez zdieľací list, stiahnutím, alebo sa používateľ zdieľanie zrušil (D-208). */
export type SaveResult = "shared" | "downloaded" | "cancelled";

/** Uloženie textového súboru: zdieľací list na iPhone, inak stiahnutie. Súhrn sa nikam neodosiela. */
export async function saveTextFile(name: string, text: string): Promise<SaveResult> {
  return saveBlobFile(name, new Blob([text], { type: "text/plain" }));
}

/** Uloženie súboru: zdieľací list na iPhone, inak stiahnutie (D-161). */
export async function saveBlobFile(name: string, blob: Blob): Promise<SaveResult> {
  const file = new File([blob], name, { type: blob.type });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return "shared";
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
