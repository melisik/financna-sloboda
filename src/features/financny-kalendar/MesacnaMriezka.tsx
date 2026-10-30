import { useEffect, useRef } from "react";
import type { CalendarObligation } from "../../storage/types";
import { WEEKDAYS_LONG, WEEKDAYS_SHORT, addDays, longDateSk, obligationCountLabel, type GridDay } from "../../domain/calendarGrid";
import { eur } from "../../ui/kit/format";
import { STATUS_LABEL, STATUS_MARK, STATUS_STYLE } from "./stavy";

/** Klasická mesačná mriežka (D-345): pondelok až nedeľa, 5 alebo 6 týždňov. Iba zobrazenie; akcie ostávajú v detaile dňa. */

const MAX_CHIPS = 2; // široké rozloženie: toľko povinností sa vypíše v bunke, zvyšok ako „+N“
const MAX_MARKS = 3; // úzke rozloženie: toľko značiek stavu, zvyšok ako „+N“

export function MesacnaMriezka({ month, weeks, byDate, today, selected, compact, onSelect, onOpenObligation }: {
  month: string;
  weeks: GridDay[][];
  byDate: Map<string, CalendarObligation[]>;
  today: string;
  selected: string | null;
  compact: boolean;
  onSelect: (date: string) => void;
  onOpenObligation: (o: CalendarObligation) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  // Roving tabindex: tabuľkou sa prechádza jedným zastavením Tab, v nej šípkami.
  const tabDate = selected && weeks.some((w) => w.some((d) => d.date === selected))
    ? selected
    : weeks.flat().find((d) => d.date === today && d.inMonth)?.date ?? `${month}-01`;

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    root.current?.querySelector<HTMLButtonElement>(`button[data-date="${selected}"]`)?.focus();
  }, [selected, month]);

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, date: string) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next: string | null = null;
    if (e.key in step) next = addDays(date, step[e.key]);
    else if (e.key === "Home") next = addDays(date, -(weeks.flat().find((d) => d.date === date)?.weekday ?? 0));
    else if (e.key === "End") next = addDays(date, 6 - (weeks.flat().find((d) => d.date === date)?.weekday ?? 0));
    if (!next) return;
    e.preventDefault();
    moveFocus.current = true;
    onSelect(next);
  };

  return (
    <div ref={root}>
      <div role="grid" aria-label="Mesačný kalendár povinností" style={{ border: "1px solid var(--border-strong)", borderRadius: 8, overflow: "hidden", background: "var(--surface)" }}>
        <div role="row" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", background: "var(--surface-2)" }}>
          {WEEKDAYS_SHORT.map((w, i) => (
            <div key={w} role="columnheader" aria-label={WEEKDAYS_LONG[i]} style={{ textAlign: "center", padding: "6px 0", fontSize: "0.8em", fontWeight: 600, color: "var(--muted)" }}>{w}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} role="row" style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
            {week.map((d) => {
              const list = byDate.get(d.date) ?? [];
              const isToday = d.date === today;
              const isSel = d.date === selected;
              const overdue = list.filter((o) => o.status === "po_splatnosti").length;
              const label = `${longDateSk(d.date)}${list.length ? `, ${list.length} ${obligationCountLabel(list.length)}` : ", bez povinností"}${overdue ? `, z toho po splatnosti ${overdue}` : ""}${isToday ? ", dnes" : ""}${d.inMonth ? "" : ", iný mesiac"}`;
              return (
                <div
                  key={d.date}
                  role="gridcell"
                  aria-selected={isSel}
                  onClick={() => onSelect(d.date)}
                  style={{
                    minHeight: compact ? 56 : 104,
                    minWidth: 0,
                    padding: compact ? 2 : 4,
                    borderTop: "1px solid var(--border-soft)",
                    borderLeft: d.weekday === 0 ? "none" : "1px solid var(--border-soft)",
                    background: d.inMonth ? "var(--surface)" : "var(--surface-2)",
                    opacity: d.inMonth ? 1 : 0.65,
                    outline: isSel ? "2px solid var(--focus)" : "none",
                    outlineOffset: -2,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: compact ? "center" : "stretch",
                    gap: 2,
                    boxSizing: "border-box",
                  }}
                >
                  <button
                    type="button"
                    data-date={d.date}
                    aria-label={label}
                    aria-current={isToday ? "date" : undefined}
                    tabIndex={d.date === tabDate ? 0 : -1}
                    onClick={(e) => { e.stopPropagation(); onSelect(d.date); }}
                    onKeyDown={(e) => onKey(e, d.date)}
                    style={{
                      alignSelf: compact ? "center" : "flex-start",
                      minWidth: 26, height: 26, padding: "0 4px", borderRadius: 13, border: "none", cursor: "pointer",
                      font: "inherit", fontSize: "0.85em", fontWeight: isToday || isSel ? 700 : 400,
                      background: isToday ? "var(--primary-bg)" : "transparent",
                      color: isToday ? "var(--primary-text)" : "var(--text)",
                    }}
                  >
                    {d.day}
                  </button>
                  {compact ? (
                    list.length > 0 && (
                      <div aria-hidden="true" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1, fontSize: "0.7em", lineHeight: 1.2 }}>
                        {list.slice(0, MAX_MARKS).map((o) => (
                          <span key={o.id} style={{ ...STATUS_STYLE[o.status], borderRadius: 3, padding: "0 3px", border: "none" }}>{STATUS_MARK[o.status]}</span>
                        ))}
                        {list.length > MAX_MARKS && <span style={{ color: "var(--muted)" }}>+{list.length - MAX_MARKS}</span>}
                      </div>
                    )
                  ) : (
                    <>
                      {list.slice(0, MAX_CHIPS).map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          tabIndex={-1}
                          title={`${o.name}, ${eur(o.amountCents)}, ${STATUS_LABEL[o.status]}`}
                          onClick={(e) => { e.stopPropagation(); onOpenObligation(o); }}
                          style={{ ...STATUS_STYLE[o.status], borderRadius: 4, padding: "1px 4px", font: "inherit", fontSize: "0.72em", textAlign: "left", cursor: "pointer", minWidth: 0, width: "100%", boxSizing: "border-box" }}
                        >
                          <span aria-hidden="true">{STATUS_MARK[o.status]} </span>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.name}</span>
                          <span style={{ display: "block" }}>{eur(o.amountCents)}</span>
                        </button>
                      ))}
                      {list.length > MAX_CHIPS && (
                        <span style={{ fontSize: "0.72em", color: "var(--muted)", paddingLeft: 4 }}>+{list.length - MAX_CHIPS} ďalších</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p aria-hidden="true" style={{ margin: "6px 0 0", fontSize: "0.8em", color: "var(--muted)" }}>
        {STATUS_MARK.caka} {STATUS_LABEL.caka} · {STATUS_MARK.zaplatene} {STATUS_LABEL.zaplatene} · {STATUS_MARK.po_splatnosti} {STATUS_LABEL.po_splatnosti}
      </p>
    </div>
  );
}
