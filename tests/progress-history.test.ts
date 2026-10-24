import { describe, expect, it } from "vitest";
import { historyShift } from "../src/domain/progressHistory";
import { goalCell, historyLine } from "../src/features/prehlad/progressText";
import type { GoalDisplay } from "../src/domain/goalDisplay";

// Vývoj v čase (D-289, docs/44): posun dátumu cieľa od prvého vyhodnotenia a text tabuľky. Syntetické hodnoty.
const date = (d: string): GoalDisplay => ({ kind: "date", date: d, remainingMonths: 0 });

describe("posun dátumu cieľa od prvého vyhodnotenia", () => {
  it("porovná prvé a posledné vyhodnotenie; kladné mesiace = bližšie", () => {
    const rows = [
      { date: "2025-10-31", goal: date("2045-01-31") },
      { date: "2026-08-31", goal: date("2041-11-30") },
      { date: "2026-09-30", goal: date("2040-12-30") },
    ];
    expect(historyShift(rows)).toEqual({ months: 49, since: "2025-10-31", from: "2045-01-31", to: "2040-12-30" });
  });

  it("menej ako dve vyhodnotenia alebo cieľ, ktorý nie je dátum, posun nemá", () => {
    expect(historyShift([{ date: "2026-09-30", goal: date("2040-12-30") }])).toBeNull();
    expect(historyShift([{ date: "2026-08-31", goal: { kind: "unreachable" } }, { date: "2026-09-30", goal: date("2040-12-30") }])).toBeNull();
    expect(historyShift([{ date: "2026-08-31", goal: date("2041-11-30") }, { date: "2026-09-30", goal: { kind: "reached", date: "2026-09-30" } }])).toBeNull();
    expect(historyShift([{ date: "2026-08-31", goal: null }, { date: "2026-09-30", goal: null }])).toBeNull();
  });
});

describe("texty vývoja", () => {
  it("veta o posune s mesiacmi v tvare MM/RRRR, aby nezáležalo na páde", () => {
    expect(historyLine({ months: 49, since: "2025-10-31", from: "2045-01-31", to: "2040-12-30" })).toBe("Od vyhodnotenia 31.10.2025 sa dátum cieľa posunul o 49 mesiacov bližšie (z 01/2045 na 12/2040).");
    expect(historyLine({ months: -2, since: "2025-10-31", from: "2045-01-31", to: "2045-03-31" })).toBe("Od vyhodnotenia 31.10.2025 sa dátum cieľa posunul o 2 mesiace ďalej (z 01/2045 na 03/2045).");
    expect(historyLine({ months: 0, since: "2025-10-31", from: "2045-01-31", to: "2045-01-15" })).toBe("Od vyhodnotenia 31.10.2025 sa dátum cieľa nezmenil (01/2045).");
  });

  it("bunka dátumu cieľa v tabuľke", () => {
    expect(goalCell(date("2040-12-30"))).toBe("12/2040");
    expect(goalCell({ kind: "reached", date: "2026-09-30" })).toBe("dosiahnutý");
    expect(goalCell({ kind: "over50" })).toBe("viac ako 50 rokov");
    expect(goalCell({ kind: "unreachable" })).toBe("nedosiahnuteľný");
    expect(goalCell(null)).toBe("—");
  });
});
