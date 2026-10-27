import { useState } from "react";
import { Nav, type SectionId } from "./Navigacia";
import { NextStep } from "./kit/NextStep";
import { btn } from "./kit/controls";
import { TRIAL_DETAILS, TRIAL_SUMMARY, deviceStore, readTrialCollapsed, saveTrialCollapsed } from "./trialNotice";
import { FeedbackBlock } from "../features/spatna-vazba/SpatnaVazba";
import { DEMO_ENABLED, PREVIEW_BUILD } from "../app/features";
import { isIosOtherBrowser } from "../app/ios";

/** Rám stránky: nadpis, skúšobné upozornenie (zbaliteľné, D-281), horný panel a spätná väzba. iOS brána (D-053, D-168) je tu, lebo ju používa rám. */

export function isStandalone(): boolean {
  return (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches) || (navigator as { standalone?: boolean }).standalone === true;
}

export function IosInstallGate() {
  return (
    <div style={{ background: "var(--ok-bg)", padding: 16, borderRadius: 8 }}>
      <h2 style={{ fontSize: "var(--font-heading)", marginTop: 0 }}>Najprv pridaj appku na plochu</h2>
      <p>Údaje sa v Safari ukladajú slabšie. Na plochu sa appka pridá takto: klikni <strong>Zdieľať</strong> (štvorček so šípkou), vyber <strong>Pridať na plochu</strong> a potom otvor appku z ikony.</p>
      <p style={{ color: "var(--muted)" }}>Potom už budeš pracovať len z ikony na ploche.</p>
    </div>
  );
}

/**
 * Pruh „Skúšobná verzia“ (D-144, D-281, docs/42): pri prvom otvorení rozbalený, potom zostane, ako ho používateľ nechal.
 * Súhrn je viditeľný vždy; celý text sa rozbalí ťuknutím. Odkaz Záloha je len pri menu (nie pri zámku či sprievodcovi) a v sekcii Záloha sa neopakuje.
 */
function TrialNotice({ section }: { section?: SectionId }) {
  const [open, setOpen] = useState(() => !readTrialCollapsed(deviceStore()));
  const change = (next: boolean) => {
    setOpen(next);
    saveTrialCollapsed(deviceStore(), !next);
  };
  return (
    <div role="note" style={{ background: "var(--warn-bg)", padding: "0 10px", borderRadius: 6, marginBottom: 12, fontSize: "var(--font-small)" }}>
      <details open={open} onToggle={(e) => { if (e.currentTarget.open !== open) change(e.currentTarget.open); }}>
        <summary style={{ minHeight: 44, boxSizing: "border-box", padding: "10px 0", cursor: "pointer" }}>
          <strong>{TRIAL_SUMMARY}</strong>
        </summary>
        <p style={{ marginTop: 0 }}>
          {TRIAL_DETAILS}
          {section && section !== "zaloha" && <> <NextStep to="zaloha">Záloha</NextStep></>}
        </p>
        <p style={{ marginTop: 0, paddingBottom: 10, marginBottom: 0 }}>
          <button type="button" style={{ ...btn, marginTop: 0 }} onClick={() => change(false)}>
            Rozumiem, zbaliť
          </button>
        </p>
      </details>
    </div>
  );
}

export function Shell({ children, nav }: { children: React.ReactNode; nav?: SectionId }) {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "16px", lineHeight: 1.5 }}>
      <h1 style={{ fontSize: "var(--font-title)" }}>Compaven</h1>
      {DEMO_ENABLED && (
        <p role="note" style={{ background: "var(--warn-bg)", padding: "8px 12px", borderRadius: 6, fontSize: "var(--font-small)", marginBottom: 8 }}>
          <strong>Demo rezim</strong> - zobrazuju sa ukazkove data. Zmeny sa neukladaju.
        </p>
      )}
      {!DEMO_ENABLED && <TrialNotice section={nav} />}
      {typeof navigator !== "undefined" && isIosOtherBrowser(navigator.userAgent) && !isStandalone() && (
        <p role="note" style={{ background: "var(--ok-bg)", padding: 10, borderRadius: 6, fontSize: "var(--font-small)" }}>
          Na plochu appku pridáš v Safari: otvor túto adresu v Safari, potom Zdieľať → Pridať na plochu. Tu ju môžeš používať aj bez toho.
        </p>
      )}
      {nav && <Nav active={nav} />}
      {children}
      <FeedbackBlock preview={PREVIEW_BUILD} />
    </main>
  );
}
