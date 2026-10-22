import { Nav, type SectionId } from "./Navigacia";
import { FeedbackBlock } from "../features/spatna-vazba/SpatnaVazba";
import { isIosOtherBrowser } from "../app/ios";

/** Rám stránky: nadpis, skúšobné upozornenie, horný panel a spätná väzba. iOS brána (D-053, D-168) je tu, lebo ju používa rám. */

export function isStandalone(): boolean {
  return (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches) || (navigator as { standalone?: boolean }).standalone === true;
}

export function IosInstallGate() {
  return (
    <div style={{ background: "var(--ok-bg)", padding: 16, borderRadius: 8 }}>
      <h2 style={{ fontSize: "1.1rem", marginTop: 0 }}>Najprv pridaj appku na plochu</h2>
      <p>Údaje sa v Safari ukladajú slabšie. Na plochu sa appka pridá takto: klikni <strong>Zdieľať</strong> (štvorček so šípkou), vyber <strong>Pridať na plochu</strong> a potom otvor appku z ikony.</p>
      <p style={{ color: "var(--muted)" }}>Potom už budeš pracovať len z ikony na ploche.</p>
    </div>
  );
}

export function Shell({ children, nav }: { children: React.ReactNode; nav?: SectionId }) {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "16px", lineHeight: 1.5 }}>
      <h1 style={{ fontSize: "1.5rem" }}>Finančná sloboda</h1>
      <div role="note" style={{ background: "var(--warn-bg)", padding: 10, borderRadius: 6, marginBottom: 12, fontSize: "0.9rem" }}>
        <strong>Skúšobná verzia.</strong> Údaje sú len v tomto zariadení, nie sú zašifrované a môžu sa stratiť, preto si pravidelne ukladaj zálohu. Appka sa poskytuje bez záruky a nie je finančné poradenstvo. Fáza 2 zatiaľ nie je právne posúdená ani bezpečnostne auditovaná.
      </div>
      <p style={{ color: "var(--muted)" }}>Údaje sa ukladajú len v tomto zariadení. Výpočet je pred daňou; poplatky sa odpočítajú od výnosu, ak ich zadáš.</p>
      {typeof navigator !== "undefined" && isIosOtherBrowser(navigator.userAgent) && !isStandalone() && (
        <p role="note" style={{ background: "var(--ok-bg)", padding: 10, borderRadius: 6, fontSize: "0.9rem" }}>
          Na plochu appku pridáš v Safari: otvor túto adresu v Safari, potom Zdieľať → Pridať na plochu. Tu ju môžeš používať aj bez toho.
        </p>
      )}
      {nav && <Nav active={nav} />}
      {children}
      <FeedbackBlock />
    </main>
  );
}
