import type { AppData } from "../../storage/types";
import type { Ctx } from "../../domain/context";
import { recurringImpact, type ImpactGroup, type ImpactItem } from "../../domain/recurringImpact";
import { eurKeep as eur, todayIso } from "../../ui/kit/format";
import { hintStyle } from "../../ui/kit/controls";
import { NextStep } from "../../ui/kit/NextStep";
import { earlierText } from "./recurringText";

const GROUP_LABEL: Record<ImpactGroup["necessity"], string> = { nie_nevyhnutne: "Nie nevyhnutné", ostatne: "Ostatné", nevyhnutne: "Nevyhnutné" };
const mm = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

function detail(i: ImpactItem): string {
  if (i.kind === "kategoria") return `priemer za 3 mesiace · ${eur(i.monthlyCents)} mesačne`;
  return i.yearlyCents !== undefined ? `pravidelný · ${eur(i.yearlyCents)} ročne (${eur(i.monthlyCents)} mesačne)` : `pravidelný · ${eur(i.monthlyCents)} mesačne`;
}

/**
 * Opakované výdavky a dátum cieľa (D-290, docs/45: U1, V3, S1). Vecne, bez hodnotenia (`docs/03`, zásada 2):
 * o koľko skôr by bol cieľ, keby sa suma mesačne investovala. Nič sa neukladá.
 */
export function OpakovaneVydavkyBlock({ data, ctx }: { data: AppData; ctx: Ctx }) {
  if (ctx.target === null || !ctx.latest) return null;
  const r = recurringImpact({
    transactions: data.transactions,
    recurring: data.recurringExpenses,
    today: todayIso(),
    capital: ctx.evaluated,
    mInv: ctx.mInv,
    mCash: ctx.mCash,
    rate: ctx.realReturn,
    targetCents: ctx.target,
    rentals: ctx.rentals,
  });
  return (
    <section aria-labelledby="opakovane-vydavky" style={{ marginTop: 24 }}>
      <h3 id="opakovane-vydavky" style={{ fontSize: "var(--font-text)", marginBottom: 4 }}>Opakované výdavky a dátum cieľa</h3>
      {r.status === "no_goal" && r.reason === "reached" ? (
        <p>Cieľ je podľa posledného vyhodnotenia dosiahnutý, zoznam sa preto neukazuje.</p>
      ) : r.status === "no_goal" ? (
        <p>Zoznam sa ukáže, keď bude dátum cieľa do 50 rokov. <NextStep to="nastavenia">Nastavenia</NextStep></p>
      ) : (
        <>
          <p style={hintStyle}>Keby sa suma z riadku mesačne investovala namiesto výdavku, dátum cieľa by bol približne o toľko skôr. Odhad pred daňou a poplatkami, nie odporúčanie.</p>
          {r.groups.length === 0 && (
            <p>Zatiaľ tu nie sú pravidelné výdavky ani výdavky za 3 celé mesiace. <NextStep to="pravidelne-vydavky">Pravidelné výdavky</NextStep></p>
          )}
          {r.groups.map((g) => (
            <div key={g.necessity}>
              <h4 style={{ fontSize: "var(--font-small)", color: "var(--muted)", margin: "14px 0 4px" }}>{GROUP_LABEL[g.necessity]}</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {g.items.map((i) => (
                  <li key={i.key} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "0 8px", padding: "8px 0", borderBottom: "1px solid var(--border-soft)" }}>
                    {/* Na úzkej obrazovke sa výsledok presunie pod názov, aby ho nestláčal. */}
                    <span style={{ flex: "1 1 170px" }}>
                      <strong>{i.name}</strong>
                      <span style={{ display: "block", ...hintStyle }}>{detail(i)}</span>
                    </span>
                    <span style={{ whiteSpace: "nowrap", marginLeft: "auto" }}>{earlierText(i.monthsEarlier)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!r.categoriesShown && <p style={hintStyle}>Priemery kategórií sa ukážu, keď budú zapísané výdavky aspoň za 3 celé mesiace.</p>}
          <p style={hintStyle}>
            {r.categoriesShown && <>Priemer je z výdavkov v transakciách za posledné 3 celé mesiace ({mm(r.window.from)} až {mm(r.window.to)}). </>}
            Pravidelné výdavky sú zo sekcie Pravidelné výdavky. Splátky úverov a hypoték zo sekcie Záväzky tu nie sú; ak ich zapisuješ ako výdavky, sú v priemere kategórie. Kategória dôchodok tu nie je, je to sporenie. Počíta sa z kapitálu pri poslednom vyhodnotení, ako dátum cieľa na Prehľade; scenár vyššie počíta aj s transakciami po vyhodnotení. Riadky sa nesčítavajú: viac položiek naraz neposunie cieľ o súčet riadkov. Zaradenie kategórií je ako v rozpise výdavkov na Prehľade.
          </p>
        </>
      )}
    </section>
  );
}
