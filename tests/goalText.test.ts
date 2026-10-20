import { describe, expect, it } from "vitest";
import { goalDateText } from "../src/domain/goalText";
import { goalDisplay } from "../src/domain/goalDisplay";

// Oprava dátumu cieľa: dlhé horizonty a nulové sporenie sa nesmú zobraziť ako dátum (O-5, FR-10).
const fmt = (iso: string) => `formát ${iso}`;

describe("text dátumu cieľa", () => {
  it("dátum v rámci 50 rokov sa zobrazí ako dátum", () => {
    const d = goalDisplay(120, "2026-10-01", "2026-10-19");
    expect(goalDateText(d, false, fmt)).toBe(`formát ${d.kind === "date" ? d.date : ""}`);
  });

  it("viac ako 50 rokov sa nezobrazí ako dátum, ale ako upozornenie", () => {
    const d = goalDisplay(900, "2026-10-01", "2026-10-19");
    expect(d.kind).toBe("over50");
    expect(goalDateText(d, false, fmt)).toMatch(/Viac ako 50 rokov/);
  });

  it("pri nulovom sporení a nedosiahnuteľnom cieli sa používateľ vyzve, aby zadal sporenie", () => {
    const d = goalDisplay(null, "2026-10-01", "2026-10-19");
    expect(goalDateText(d, true, fmt)).toBe("Pri tomto sporení cieľ nedosiahneš. Zadaj mesačné sporenie.");
    expect(goalDateText(d, false, fmt)).toBe("Pri súčasnom sporení a výnose sa cieľ nedosiahne");
  });

  it("dosiahnutý cieľ má vlastný text", () => {
    expect(goalDateText(goalDisplay(0, "2026-10-01", "2026-10-19"), false, fmt)).toBe("Cieľ je dosiahnutý");
  });
});
