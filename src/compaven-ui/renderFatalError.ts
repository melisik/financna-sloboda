/** Vykreslí fatálnu chybu ako text; správa môže obsahovať nedôveryhodný vstup, preto nikdy nejde do innerHTML. */
export function renderFatalError(root: HTMLElement, message: string): void {
  const doc = root.ownerDocument;
  const box = doc.createElement("div");
  box.style.padding = "20px";
  box.style.color = "red";

  const title = doc.createElement("strong");
  title.textContent = "⚠️ Environment Configuration Error";

  const detail = doc.createElement("pre");
  detail.textContent = message;

  box.append(title, detail);
  root.replaceChildren(box);
}
