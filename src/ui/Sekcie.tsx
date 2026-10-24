import type { Repository } from "../storage/repository";
import type { AppData } from "../storage/types";
import type { Ctx } from "../domain/context";
import { investmentsTotalCents } from "../domain/investments";
import { PHASE2_ENABLED } from "../app/features";
import { Section, btn } from "./kit/controls";
import { NextStep } from "./kit/NextStep";
import { todayIso } from "./kit/format";
import { ModulesBlock, useModules } from "./Moduly";
import type { SectionId } from "./Navigacia";
import { HomeSection } from "../features/prehlad/Prehlad";
import { NavodBlock } from "../features/prehlad/Navod";
import { TransactionSection } from "../features/transakcie/Transakcie";
import { ScenarVydavkuSection } from "../features/scenar-vydavku/ScenarVydavku";
import { AttachmentsBlock } from "../features/doklady/Prilohy";
import { SnapshotSection } from "../features/vyhodnotenie/Vyhodnotenie";
import { PropertySection } from "../features/majetok/Majetok";
import { BudgetSection } from "../features/rozpocet/Rozpocet";
import { IncomeSection } from "../features/prijmy/Prijmy";
import { LiabilitySection } from "../features/zavazky/Zavazky";
import { InvestmentSection } from "../features/investicie/Investicie";
import { RecurringSection } from "../features/pravidelne/Pravidelne";
import { DogSection, TaxFormBlock, TaxSection } from "../features/dane/Dane";
import { StockSection } from "../features/sklad/Sklad";
import { RocnyPrehladSection } from "../features/rocny-prehlad/RocnyPrehlad";
import { SettingsSection } from "../features/nastavenia/Nastavenia";
import { PinSection } from "../features/zamok/Lock";
import { BackupSection } from "../features/zaloha/BackupSection";

/** Obsah jednej sekcie: ktorá sekcia sa zobrazí a s akými údajmi a callbackmi. Sekcia sa vytvára nanovo pri každej zmene (key v App). */
type SectionViewProps = {
  section: SectionId;
  repo: Repository;
  data: AppData;
  ctx: Ctx;
  reload: () => Promise<void>;
  lastExport: string | null;
  setLastExport: (iso: string) => void;
  budgetFlash: string | null;
  setBudgetFlash: (msg: string) => void;
  settingsFlash: string | null;
  setSettingsFlash: (msg: string) => void;
  pinSet: boolean;
  setPinSet: (on: boolean) => void;
  setLocked: (on: boolean) => void;
  setWizardOpen: (open: boolean) => void;
};

export function SectionView({ section, repo, data, ctx, reload, lastExport, setLastExport, budgetFlash, setBudgetFlash, settingsFlash, setSettingsFlash, pinSet, setPinSet, setLocked, setWizardOpen }: SectionViewProps) {
  const { visible } = useModules();
  switch (section) {
    case "prehlad":
      return (
        <Section id="prehlad" title="Prehľad">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <HomeSection data={data} ctx={ctx} lastExport={lastExport} incomeVisible={visible.has("prijmy")} />
              <NavodBlock />
            </div>
            {PHASE2_ENABLED && (
              <aside style={{ flex: "1 1 260px", maxWidth: "100%", background: "var(--surface)", padding: 12, borderRadius: 8 }}>
                <ModulesBlock style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }} />
              </aside>
            )}
          </div>
        </Section>
      );
    case "nova-transakcia":
      return (
        <Section id="nova-transakcia" title="Transakcie">
          <TransactionSection repo={repo} data={data} ctx={ctx} onChanged={reload} renderAttachments={(id) => <AttachmentsBlock repo={repo} owner={{ transactionId: id }} />} />
        </Section>
      );
    case "scenar-vydavku":
      return (
        <Section id="scenar-vydavku" title="Veľký výdavok (scenár)">
          <ScenarVydavkuSection ctx={ctx} />
        </Section>
      );
    case "vyhodnotenie":
      return (
        <Section id="vyhodnotenie" title="Vyhodnotenie">
          <SnapshotSection key={`${ctx.latest?.id ?? "none"}-${ctx.capital.inv}-${ctx.capital.cash}-${data.investments.length}`} repo={repo} latest={ctx.latest} capital={ctx.capital} derivedInvCents={data.investments.length ? investmentsTotalCents(data.investments) : null} snapshots={data.snapshots} properties={data.properties} positions={data.investments} onSaved={reload} />
        </Section>
      );
    case "majetok":
      return (
        <Section id="majetok" title="Majetok">
          <PropertySection repo={repo} properties={data.properties} assets={data.assets} today={todayIso()} onSaved={reload} renderRentalAttachments={(id) => <AttachmentsBlock repo={repo} owner={{ rentalEntryId: id }} />} />
        </Section>
      );
    case "rozpocet":
      return (
        <Section id="rozpocet" title="Rozpočet">
          {budgetFlash && <p style={{ background: "var(--ok-bg)", padding: 8, borderRadius: 6, color: "var(--ok)" }}>{budgetFlash}</p>}
          <BudgetSection key={data.budgets.map((b) => `${b.category}${b.limitCents}`).join("|")} repo={repo} budgets={data.budgets} transactions={data.transactions} recurring={data.recurringExpenses} properties={data.properties} today={todayIso()} onSaved={() => { reload(); setBudgetFlash("Rozpočet je uložený."); }} />
        </Section>
      );
    case "prijmy":
      return (
        <Section id="prijmy" title="Príjmy">
          <IncomeSection repo={repo} incomes={data.incomes} data={data} today={todayIso()} onSaved={reload} />
        </Section>
      );
    case "zavazky":
      return (
        <Section id="zavazky" title="Záväzky">
          <LiabilitySection repo={repo} liabilities={data.liabilities} today={todayIso()} onSaved={reload} />
        </Section>
      );
    case "investicie":
      return (
        <Section id="investicie" title="Investície">
          <InvestmentSection repo={repo} positions={data.investments} goals={data.goals} today={todayIso()} onSaved={reload} />
        </Section>
      );
    case "pravidelne-vydavky":
      return (
        <Section id="pravidelne-vydavky" title="Pravidelné výdavky">
          <RecurringSection repo={repo} items={data.recurringExpenses} today={todayIso()} onSaved={reload} />
        </Section>
      );
    case "dane":
      return (
        <Section id="dane" title="Dane">
          <TaxSection positions={data.investments} />
          <DogSection repo={repo} dogs={data.dogs} today={todayIso()} onSaved={reload} />
          <TaxFormBlock properties={data.properties} dogs={data.dogs} today={todayIso()} />
        </Section>
      );
    case "sklad":
      return (
        <Section id="sklad" title="Sklad">
          <StockSection repo={repo} items={data.stockItems} recipes={data.recipes} today={todayIso()} onSaved={reload} />
        </Section>
      );
    case "rocny-prehlad":
      return (
        <Section id="rocny-prehlad" title="Ročný prehľad">
          <RocnyPrehladSection data={data} ctx={ctx} />
        </Section>
      );
    case "nastavenia":
      return (
        <Section id="nastavenia" title="Nastavenia">
          {settingsFlash && <p style={{ background: "var(--ok-bg)", padding: 8, borderRadius: 6, color: "var(--ok)" }}>{settingsFlash} <NextStep to="prehlad">Prehľad</NextStep></p>}
          <SettingsSection key={JSON.stringify(data.settings)} repo={repo} settings={data.settings} derived={ctx.derived} onSaved={() => { reload(); setSettingsFlash("Nastavenia sú uložené."); }} />
          <ModulesBlock />
          <section style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: "1rem" }}>Sprievodca</h3>
            <p style={{ color: "var(--muted)" }}>Prejdi sprievodcu znova. Údaje sa predvyplnia a nič sa nevymaže.</p>
            <button onClick={() => setWizardOpen(true)} style={btn}>Spustiť sprievodcu znova</button>
          </section>
          <PinSection repo={repo} pinSet={pinSet} onChanged={(on) => setPinSet(on)} onLock={() => setLocked(true)} />
        </Section>
      );
    case "zaloha":
      return (
        <Section id="zaloha" title="Záloha">
          <BackupSection repo={repo} data={data} lastExport={lastExport} onChanged={reload} onExported={async (iso) => { await repo.setMeta("lastExportAt", iso); setLastExport(iso); }} />
        </Section>
      );
  }
}
