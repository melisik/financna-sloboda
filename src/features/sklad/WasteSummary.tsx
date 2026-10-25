import { type WasteRecord } from "../../storage/types";
import { wasteSummary } from "../../domain/waste";
import { plural } from "../../domain/impact";
import { dateSk, eur } from "../../ui/kit/format";
import { hintStyle } from "../../ui/kit/controls";

import { qtyText } from "./format";

/** Vyhodené potraviny tento mesiac a rok (D-301). Vecne, bez hodnotenia; vyhodené nie je nový výdavok. */
export function WasteSummary({ records, today }: { records: WasteRecord[]; today: string }) {
  if (records.length === 0) return null;
  const w = wasteSummary(records, today);
  const month = records.filter((r) => r.date.slice(0, 7) === today.slice(0, 7)).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div style={{ margin: "8px 0" }}>
      <p style={{ margin: 0 }}>
        Vyhodené tento mesiac: {eur(w.monthCents)} ({w.monthCount} {plural(w.monthCount, "položka", "položky", "položiek")}) · tento rok: {eur(w.yearCents)}
        {w.monthWithoutPrice > 0 ? ` · bez ceny: ${w.monthWithoutPrice}` : ""}
      </p>
      <p style={{ ...hintStyle, margin: "2px 0" }}>Vyhodené sa neráta ako nový výdavok; peniaze sa minuli pri nákupe.</p>
      {month.length > 0 && (
        <details>
          <summary style={{ cursor: "pointer" }}>Vyhodené tento mesiac ▾</summary>
          <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
            {month.map((r) => <li key={r.id}>{dateSk(r.date)} · {r.name} · {qtyText(r.quantity)} {r.unit} · {r.valueCents !== undefined ? eur(r.valueCents) : "bez ceny"}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}
