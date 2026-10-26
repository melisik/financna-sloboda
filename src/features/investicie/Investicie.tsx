import { useState } from "react";
import type { Repository } from "../../storage/repository";
import { BALANCE_INVESTMENT_KINDS, INVESTMENT_KINDS, TAX_REGIMES, type InvestmentGoal, type InvestmentKind, type Position, type TaxRegime } from "../../storage/types";
import { checkDate } from "../../storage/validate";
import { applyGoalShares, goalProgress, groupByGoal, investmentsByKindCents, investmentsTotalCents, monthlyContributionsTotalCents, positionShares, positionValueCents, staleValuationNames } from "../../domain/investments";
import { TAX_CATALOG } from "../../domain/tax";
import providerList from "../../data/nbsProviders.json";
import type { Provider } from "../../domain/nbsProviders";
import { cents, dateSk, eur } from "../../ui/kit/format";
import { uid } from "../../ui/kit/ids";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { Field, asNum, btn, type NumIn, btnPrimary, btnDanger } from "../../ui/kit/controls";
import { FoldBlock } from "../../ui/kit/FoldBlock";
import { NextStep } from "../../ui/kit/NextStep";
import { calloutStyle, hintStyle } from "../../ui/kit/controls";
import { card } from "../../ui/kit/controls";

/** Investície (D-101, D-105): ručné položky a ich ocenenie; súčet sa použije vo Vyhodnotení. Feature „investicie“ (docs/23). */

const INVESTMENT_KIND_LABEL: Record<InvestmentKind, string> = {
  akcie: "Akcie",
  etf: "ETF",
  fond: "Podielový fond",
  dlhopisy: "Dlhopisy",
  krypto: "Kryptomeny",
  zlato_komodity: "Zlato a komodity",
  sporiaci_ucet: "Sporiaci účet alebo termínovaný vklad",
  treti_pilier: "Tretí pilier",
  dochodkove_sporenie: "Dôchodkové sporenie (2. pilier)",
  ine: "Iné",
};

/** Sekcia Investície (D-101, možnosť A): ručné položky; súčet sa použije vo Vyhodnotení. */
export function InvestmentSection({ repo, positions, goals, today, onSaved }: { repo: Repository; positions: Position[]; goals: InvestmentGoal[]; today: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<Position | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState<InvestmentGoal | "new" | null>(null);
  const [goalConfirm, setGoalConfirm] = useState<string | null>(null);

  // Zmazanie cieľa nezmaže položky; odpojí ich od cieľa. updatedAt sa nemení, lebo nejde o zmenu ocenenia (D-101).
  const removeGoal = async (id: string) => {
    try {
      for (const p of positions) {
        if (!positionShares(p).some((s) => s.goalId === id)) continue;
        const { goalId: _legacy, goalShares: _old, ...rest } = p;
        const left = positionShares(p).filter((s) => s.goalId !== id);
        await repo.savePosition({ ...rest, ...(left.length > 0 ? { goalShares: left } : {}) });
      }
      await repo.deleteGoal(id);
      setGoalConfirm(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const remove = async (id: string) => {
    try {
      await repo.deletePosition(id);
      setConfirmId(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>
        Zadávaš počet kusov, cenu a kurz k euru. Hodnota v eurách sa počíta v telefóne; nič sa neposiela von. Suma investícií vo Vyhodnotení je súčtom týchto položiek.
      </p>
      {staleValuationNames(positions, today).length > 0 && (
        <p style={calloutStyle("warn")}>
          Staré ocenenie (viac ako 3 mesiace): {staleValuationNames(positions, today).join(", ")}. Over cenu a aktualizuj položku.
        </p>
      )}
      {positions.length === 0 && editing === null && <p>Zatiaľ nie je zapísaná žiadna položka. Vo <a href="#vyhodnotenie">Vyhodnotení</a> sa suma zadáva ručne.</p>}
      {positions.length > 0 && (
        <p style={hintStyle}>Súčet položiek je hodnota investícií vo Vyhodnotení. <NextStep to="vyhodnotenie">Vyhodnotenie</NextStep></p>
      )}
      {positions.length > 0 && (
        <p style={{ fontSize: "var(--font-text)" }}>Spolu: <strong>{eur(investmentsTotalCents(positions))}</strong></p>
      )}
      {positions.length > 0 && (
        <p style={hintStyle}>
          {Object.entries(investmentsByKindCents(positions)).map(([k, v]) => `${INVESTMENT_KIND_LABEL[k as Position["kind"]]} ${eur(v ?? 0)}`).join(" · ")}
        </p>
      )}
      {monthlyContributionsTotalCents(positions) > 0 && (
        <p style={{ color: "var(--muted)" }}>Mesačné vklady do tretieho piliera a iných položiek: {eur(monthlyContributionsTotalCents(positions))} (len zobrazenie)</p>
      )}
      <h4 style={{ fontSize: "var(--font-text)", marginBottom: 4 }}>Ciele</h4>
      <p style={{ ...hintStyle, marginTop: 0 }}>
        Položky môžeš zoskupiť do cieľa a sledovať, koľko z cieľovej sumy už máš (percento je aj na Prehľade). Ciele sú len zobrazenie a nemenia výpočet cieľa nezávislosti.
      </p>
      {goals.map((g) =>
        goalForm !== null && goalForm !== "new" && goalForm.id === g.id ? (
          <GoalForm
            key={g.id}
            repo={repo}
            positions={positions}
            goals={goals}
            initial={g}
            onDone={() => { setGoalForm(null); onSaved(); }}
            onCancel={() => setGoalForm(null)}
          />
        ) : (
          <div key={g.id} style={{ marginBottom: 6 }}>
            <p style={{ margin: "4px 0" }}>
              <strong>{g.name}</strong> · cieľová suma {eur(g.targetCents)}{g.receivesRest ? " · prijíma všetko nepriradené" : ""}
            </p>
            {goalConfirm === g.id ? (
              <div>
                <p>Naozaj zmazať cieľ „{g.name}“? Položky zostanú, len sa odpoja od cieľa.</p>
                <button onClick={() => removeGoal(g.id)} style={btnDanger}>Potvrdiť zmazanie</button>{" "}
                <button onClick={() => setGoalConfirm(null)} style={btn}>Zrušiť</button>
              </div>
            ) : (
              <div>
                <button onClick={() => setGoalForm(g)} style={btn}>Upraviť cieľ</button>{" "}
                <button onClick={() => setGoalConfirm(g.id)} style={btnDanger}>Zmazať cieľ</button>
              </div>
            )}
          </div>
        ),
      )}
      {goalForm === "new" && (
        <GoalForm repo={repo} positions={positions} goals={goals} onDone={() => { setGoalForm(null); onSaved(); }} onCancel={() => setGoalForm(null)} />
      )}
      {goalForm === null && (
        <button onClick={() => setGoalForm("new")} style={btn}>Pridať cieľ</button>
      )}
      {groupByGoal(positions, goals).map((g) => {
        const prog = g.goal ? goalProgress(g.totalCents, g.goal.targetCents) : null;
        return (
          <div key={g.goal?.id ?? "bez-cieľa"} style={{ marginBottom: 12 }}>
            {goals.length > 0 && (
              <p style={{ margin: "10px 0 4px", fontWeight: 600 }}>
                {g.goal ? g.goal.name : "Bez cieľa"}: {eur(g.totalCents)}
                {g.goal && prog && (prog.reached ? <span style={{ fontWeight: 400 }}> · cieľ dosiahnutý</span> : <span style={{ fontWeight: 400 }}> · {prog.percent} % z {eur(g.goal.targetCents)}</span>)}
              </p>
            )}
            {g.goal && g.positions.length === 0 && <p style={{ color: "var(--muted)" }}>Zatiaľ žiadna položka v tomto cieli.</p>}
            {g.parts.map(({ position: p, percent, cents }) => (
        <div key={p.id} style={{ ...card, marginBottom: 8 }}>
          <p style={{ margin: 0 }}><strong>{p.name}</strong> · {INVESTMENT_KIND_LABEL[p.kind]}{p.provider ? ` · ${p.provider.name}` : ""}</p>
          {(BALANCE_INVESTMENT_KINDS as readonly string[]).includes(p.kind) ? (
            <p style={{ margin: "4px 0" }}>
              Stav účtu: {eur(positionValueCents(p))}
              {p.monthlyContributionCents ? `, vklad ${eur(p.monthlyContributionCents)} mesačne` : ""}
            </p>
          ) : (
            <p style={{ margin: "4px 0" }}>
              {String(p.quantity)} ks × {String(p.unitPrice)} {p.currency}
              {p.currency !== "EUR" && <span> (kurz {String(p.fxToEur)})</span>}
            </p>
          )}
          <p style={{ margin: "4px 0" }}>Hodnota: <strong>{eur(positionValueCents(p))}</strong> (k {dateSk(p.valueDate)})</p>
          {percent < 100 && <p style={{ ...hintStyle, margin: "4px 0" }}>{g.goal ? `Podiel v tomto cieli: ${percent} % (${eur(cents)})` : `Nepriradené: ${percent} % (${eur(cents)})`}</p>}
          {confirmId === p.id ? (
            <div>
              <p>Naozaj zmazať položku „{p.name}“?</p>
              <button onClick={() => remove(p.id)} style={btnDanger}>Potvrdiť zmazanie</button>{" "}
              <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <div>
              <button onClick={() => { setEditing(p); setErr(null); }} style={btn}>Upraviť</button>{" "}
              <button onClick={() => setConfirmId(p.id)} style={btnDanger}>Zmazať</button>
            </div>
          )}
        </div>
            ))}
          </div>
        );
      })}
      {editing !== null ? (
        <InvestmentForm
          key={editing === "new" ? "new" : editing.id}
          repo={repo}
          initial={editing === "new" ? null : editing}
          goals={goals}
          today={today}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing("new")} style={btnPrimary}>Pridať položku</button>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
  );
}

const PROVIDERS: Provider[] = providerList.providers;
const providerByName = (name: string): Provider | undefined => PROVIDERS.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());
/** Zo zoznamu NBS (s IČO), inak vlastný názov (D-329). */
function providerFromInput(input: string): { ico?: string; name: string } {
  const hit = providerByName(input);
  return hit ? { ico: hit.ico, name: hit.name.trim() } : { name: input.trim() };
}

/** Výber poskytovateľa zo zoznamu firiem registra NBS alebo vlastný názov (D-329, docs/63, docs/64). Nie je to odporúčanie. */
function goalSummaryText(goals: InvestmentGoal[], shares: Record<string, NumIn>): string {
  const parts = goals.flatMap((g) => { const v = shares[g.id]; const n = v === undefined || v === "" ? 0 : asNum(v); return n > 0 ? [`${g.name} ${n} %`] : []; });
  return parts.length > 0 ? parts.join(", ") : "bez cieľa";
}

function ProviderField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hit = providerByName(value);
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ display: "block" }}>
        Poskytovateľ (nepovinné)
        <input list="poskytovatelia-nbs" aria-label="Poskytovateľ" value={value} maxLength={120} onChange={(e) => onChange(e.target.value)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4, boxSizing: "border-box" }} />
      </label>
      <datalist id="poskytovatelia-nbs">
        {PROVIDERS.map((p) => <option key={p.ico + p.type} value={p.name.trim()} label={p.type} />)}
      </datalist>
      <p style={hintStyle}>
        Vyber zo zoznamu alebo napíš vlastný názov (napr. Trading 212). Zdroj zoznamu: {providerList.source}, stav k {dateSk(providerList.updated)}. Výber firiem, nie odporúčanie ani záruka úplnosti.
      </p>
      {/* Odkaz je tlačidlo s veľkou plochou: malý textový odkaz sa na iPhone ťažko trafil (prehliadka 2026-10-26). Pri vlastnom názve sa hľadá podľa názvu (zahraničné firmy s cezhraničným pôsobením register eviduje tiež). */}
      {hit && <a href={`https://subjekty.nbs.sk/sk/search?q=${hit.ico}`} target="_blank" rel="noopener noreferrer" style={{ ...btn, display: "inline-flex", alignItems: "center", textDecoration: "none", color: "inherit" }}>Overiť v registri NBS</a>}
      {!hit && value.trim().length >= 3 && <a href={`https://subjekty.nbs.sk/sk/search?q=${encodeURIComponent(value.trim())}`} target="_blank" rel="noopener noreferrer" style={{ ...btn, display: "inline-flex", alignItems: "center", textDecoration: "none", color: "inherit" }}>Vyhľadať v registri NBS</a>}
    </div>
  );
}

function InvestmentForm({ repo, initial, goals, today, onDone, onCancel }: { repo: Repository; initial: Position | null; goals: InvestmentGoal[]; today: string; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<InvestmentKind>(initial?.kind ?? "etf");
  const [quantity, setQuantity] = useState<NumIn>(initial?.quantity ?? "");
  const [unitPrice, setUnitPrice] = useState<NumIn>(initial?.unitPrice ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "EUR");
  const [fx, setFx] = useState<NumIn>(initial && initial.currency !== "EUR" ? initial.fxToEur : "");
  const [contribution, setContribution] = useState<NumIn>(initial?.monthlyContributionCents !== undefined ? initial.monthlyContributionCents / 100 : "");
  const [valueDate, setValueDate] = useState(initial?.valueDate ?? today);
  const [taxRegime, setTaxRegime] = useState<TaxRegime>(initial?.taxRegime ?? "nezadane");
  // Podiel v % pri každom cieli ako text poľa; prázdne alebo 0 = položka v cieli nie je (D-334).
  const [shares, setShares] = useState<Record<string, NumIn>>(() => Object.fromEntries((initial ? positionShares(initial) : []).map((s) => [s.goalId, s.percent])));
  const [providerName, setProviderName] = useState(initial?.provider?.name ?? "");
  const [err, setErr] = useState<string | null>(null);
  const balance = (BALANCE_INVESTMENT_KINDS as readonly string[]).includes(kind);
  const code = balance ? "EUR" : currency.trim().toUpperCase();
  const isEur = code === "EUR";

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov.");
    if (trimmed.length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    // Účet (stav účtu): počet kusov je 1 a cena je stav účtu.
    const q = balance ? 1 : asNum(quantity);
    if (Number.isNaN(q) || !(q > 0)) return setErr("Vyplň počet kusov (väčší ako 0).");
    const price = asNum(unitPrice);
    if (Number.isNaN(price) || price < 0) return setErr(balance ? "Vyplň aktuálny stav účtu (0 alebo viac)." : "Vyplň cenu za kus (0 alebo viac).");
    if (!/^[A-Z]{3}$/.test(code)) return setErr("Mena musí byť trojpísmenový kód, napr. EUR alebo USD.");
    const rate = isEur ? 1 : asNum(fx);
    if (Number.isNaN(rate) || !(rate > 0)) return setErr("Vyplň kurz k euru (väčší ako 0).");
    const vklad = balance && contribution !== "" ? asNum(contribution) : 0;
    if (Number.isNaN(vklad) || vklad < 0) return setErr("Mesačný vklad musí byť číslo 0 alebo viac.");
    const dateErr = checkDate(valueDate, today, "dátum ocenenia");
    if (dateErr.length) return setErr(dateErr[0]);
    const goalShares = goals.flatMap((g) => {
      const v = shares[g.id];
      const n = v === undefined || v === "" ? 0 : asNum(v);
      return n === 0 ? [] : [{ goalId: g.id, percent: n }];
    });
    if (goalShares.some((s) => !Number.isInteger(s.percent) || s.percent < 1 || s.percent > 100)) return setErr("Podiel v cieli je celé percento od 1 do 100.");
    if (goalShares.reduce((sum, s) => sum + s.percent, 0) > 100) return setErr("Súčet podielov v cieľoch je nad 100 %.");
    if (providerName.trim().length > 120) return setErr("Poskytovateľ môže mať najviac 120 znakov.");
    const now = new Date().toISOString();
    const position: Position = {
      id: initial?.id ?? uid(),
      name: trimmed,
      kind,
      quantity: q,
      unitPrice: price,
      currency: code,
      fxToEur: rate,
      valueDate,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      ...(balance && vklad > 0 ? { monthlyContributionCents: cents(vklad) } : {}),
      taxRegime,
      ...(goalShares.length > 0 ? { goalShares } : {}),
      ...(providerName.trim() !== "" ? { provider: providerFromInput(providerName) } : {}),
    };
    try {
      await repo.savePosition(position);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "var(--font-text)", marginTop: 0 }}>{initial ? "Upraviť položku" : "Nová položka"}</h4>
      <Field label={balance ? "Názov účtu" : "Názov alebo ticker"} value={name} type="text" onChange={setName} maxLength={80} />
      <label style={{ display: "block", marginBottom: 8 }}>
        Druh
        <select value={kind} onChange={(e) => setKind(e.target.value as InvestmentKind)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {INVESTMENT_KINDS.map((k) => (
            <option key={k} value={k}>{INVESTMENT_KIND_LABEL[k]}</option>
          ))}
        </select>
      </label>
      {balance ? (
        <>
          <Field label="Aktuálny stav účtu (€)" value={unitPrice} onChange={setUnitPrice} />
          <Field label="Mesačný vklad (€, nepovinné)" value={contribution} onChange={setContribution} hint="len na zobrazenie; sporenie sa mení pri vyhodnotení" />
        </>
      ) : (
        <>
          <Field label="Počet kusov" value={quantity} step={0.0001} onChange={setQuantity} />
          <Field label="Cena za kus (v mene položky)" value={unitPrice} step={0.0001} onChange={setUnitPrice} />
          <FoldBlock title="Mena a kurz" summary={currency.trim().toUpperCase() || "EUR"} openWhen={!isEur || !!err} reopenOn={err}>
            <Field label="Mena (napr. EUR, USD)" value={currency} type="text" onChange={setCurrency} maxLength={3} />
            {!isEur && <Field label="Kurz: koľko € za 1 jednotku meny" value={fx} step={0.0001} onChange={setFx} hint="zadaj kurz v deň ocenenia" />}
          </FoldBlock>
        </>
      )}
      <ProviderField value={providerName} onChange={setProviderName} />
      <Field label="Dátum ocenenia" value={valueDate} type="date" max={today} onChange={setValueDate} />
      {/* Cieľ a daňový režim sú zbalené so súhrnom (D-311). */}
      <FoldBlock title="Cieľ a daňový režim" summary={[goalSummaryText(goals, shares), ...(taxRegime !== "nezadane" ? [TAX_CATALOG[taxRegime].label] : [])].join(" · ")} openWhen={!!err} reopenOn={err}>
        {goals.length > 0 ? (
          <fieldset style={{ border: "none", padding: 0, margin: "0 0 8px" }}>
            <legend>Podiel položky v cieľoch (nepovinné)</legend>
            {goals.map((g) => (
              <Field key={g.id} label={`Podiel v cieli „${g.name}“ (%)`} value={shares[g.id] ?? ""} onChange={(v) => setShares({ ...shares, [g.id]: v })} />
            ))}
            <p style={hintStyle}>Jedna investícia môže byť vo viacerých cieľoch; súčet podielov je najviac 100 %. {goals.some((g) => g.receivesRest) ? `Zvyšok patrí cieľu „${goals.find((g) => g.receivesRest)?.name}“.` : "Zvyšok je bez cieľa."}</p>
          </fieldset>
        ) : <p style={hintStyle}>Cieľ vytvoríš v časti Ciele vyššie.</p>}
        <label style={{ display: "block", marginBottom: 8 }}>
          Daňový režim (len evidencia, nepočíta sa)
          <select aria-label="Daňový režim investície" value={taxRegime} onChange={(e) => setTaxRegime(e.target.value as TaxRegime)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
            {TAX_REGIMES.map((r) => <option key={r} value={r}>{TAX_CATALOG[r].label}</option>)}
          </select>
        </label>
      </FoldBlock>
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btnPrimary}>Uložiť položku</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}

/** Cieľ investícií (D-105): nový alebo úprava názvu a cieľovej sumy. Cieľ nemení výpočet cieľa nezávislosti. */
function GoalForm({ repo, positions, goals, initial = null, onDone, onCancel }: { repo: Repository; positions: Position[]; goals: InvestmentGoal[]; initial?: InvestmentGoal | null; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [target, setTarget] = useState<NumIn>(initial ? initial.targetCents / 100 : "");
  // Položky cieľa a ich podiel v %: kľúč je v zozname, keď položka do cieľa patrí (D-331, D-334).
  const [receivesRest, setReceivesRest] = useState(initial?.receivesRest === true);
  const [percents, setPercents] = useState<Record<string, NumIn>>(() => Object.fromEntries(positions.flatMap((p) => { const s = initial ? positionShares(p).find((x) => x.goalId === initial.id) : undefined; return s ? [[p.id, s.percent]] : []; })));
  const [err, setErr] = useState<string | null>(null);
  // Voľné percento položky: 100 mínus podiely v iných cieľoch.
  const freePercent = (p: Position) => 100 - positionShares(p).filter((s) => s.goalId !== initial?.id && goals.some((g) => g.id === s.goalId)).reduce((sum, s) => sum + s.percent, 0);

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov cieľa.");
    if (trimmed.length > 80) return setErr("Názov cieľa môže mať najviac 80 znakov.");
    const sum = asNum(target);
    if (Number.isNaN(sum) || !(sum > 0)) return setErr("Vyplň cieľovú sumu väčšiu ako 0.");
    const now = new Date().toISOString();
    const base: InvestmentGoal = initial
      ? { ...initial, name: trimmed, targetCents: cents(sum), updatedAt: now }
      : { id: uid(), name: trimmed, targetCents: cents(sum), createdAt: now, updatedAt: now };
    const { receivesRest: _was, ...withoutRest } = base;
    const goal: InvestmentGoal = receivesRest ? { ...withoutRest, receivesRest: true } : withoutRest;
    const wanted: Record<string, number> = {};
    for (const p of positions) {
      const v = percents[p.id];
      wanted[p.id] = v === undefined || v === "" ? 0 : asNum(v);
    }
    const applied = applyGoalShares(positions, goal.id, wanted, now);
    if (applied.error) return setErr(applied.error);
    try {
      await repo.saveGoal(goal);
      // Zvyšok prijíma najviac jeden cieľ (D-335): ostatným sa príznak zruší.
      if (receivesRest) for (const other of goals) if (other.id !== goal.id && other.receivesRest) { const { receivesRest: _r, ...rest } = other; await repo.saveGoal({ ...rest, updatedAt: now }); }
      for (const p of applied.changed) await repo.savePosition(p);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)", marginBottom: 8 }}>
      <h4 style={{ fontSize: "var(--font-text)", marginTop: 0 }}>{initial ? "Upraviť cieľ" : "Nový cieľ"}</h4>
      <Field label="Názov cieľa" value={name} type="text" onChange={setName} maxLength={80} />
      <Field label="Cieľová suma (€)" value={target} onChange={setTarget} />
      <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}>
        <input type="checkbox" checked={receivesRest} onChange={(e) => setReceivesRest(e.target.checked)} />
        <span>Sem patrí všetko, čo nepatrí do iného cieľa</span>
      </label>
      {receivesRest && goals.some((g) => g.id !== initial?.id && g.receivesRest) && <p style={hintStyle}>Zvyšok doteraz patril cieľu „{goals.find((g) => g.id !== initial?.id && g.receivesRest)?.name}“; po uložení bude patriť tomuto cieľu.</p>}
      {positions.length > 0 ? (
        <fieldset style={{ border: "none", padding: 0, margin: "8px 0" }}>
          <legend>Ktoré položky patria do cieľa?</legend>
          {positions.map((p) => {
            const checked = p.id in percents;
            const free = freePercent(p);
            return (
              <div key={p.id} style={{ margin: "4px 0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}>
                  <input type="checkbox" checked={checked} onChange={(e) => {
                    const next = { ...percents };
                    if (e.target.checked) next[p.id] = free > 0 ? free : 100; else delete next[p.id];
                    setPercents(next);
                  }} />
                  <span>{p.name} · {eur(positionValueCents(p))}{!checked && free < 100 ? <span style={hintStyle}> (voľných {free} %)</span> : null}</span>
                </label>
                {checked && (
                  <Field label={`Podiel položky „${p.name}“ v tomto cieli (%)`} value={percents[p.id]} onChange={(v) => setPercents({ ...percents, [p.id]: v })} hint={free < 100 ? `voľných ${free} %, zvyšok je v iných cieľoch` : "100 % = celá položka"} />
                )}
              </div>
            );
          })}
        </fieldset>
      ) : (
        <p style={hintStyle}>Najprv pridaj položku investície; potom ju do cieľa priradíš tu alebo pri položke.</p>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btnPrimary}>Uložiť cieľ</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}
