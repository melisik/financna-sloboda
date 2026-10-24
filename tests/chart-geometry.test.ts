import { describe, expect, it } from "vitest";
import { chartMaxY, chartPoints, chartY, type ChartBox } from "../src/ui/kit/chartGeometry";

// Čiarový graf bez knižnice (D-289, docs/44): body sa počítajú čistou funkciou, SVG ich len vykreslí.
const box: ChartBox = { width: 340, height: 170, left: 8, right: 8, top: 14, bottom: 22 };

describe("body grafu", () => {
  it("mierka ide od 0 (spodok) po maximum (vrch)", () => {
    expect(chartY(0, 100, box)).toBe(148);
    expect(chartY(100, 100, box)).toBe(14);
    expect(chartY(50, 100, box)).toBe(81);
  });

  it("body sú rovnomerne od ľavého po pravý okraj", () => {
    expect(chartPoints([10, 20, 30], 100, box).map((p) => p.x)).toEqual([8, 170, 332]);
    expect(chartPoints([10, 20, 30], 100, box).map((p) => p.y)).toEqual([chartY(10, 100, box), chartY(20, 100, box), chartY(30, 100, box)]);
  });

  it("žiadna a jedna hodnota; hodnoty mimo mierky ostanú v grafe; nulové maximum nedá NaN", () => {
    expect(chartPoints([], 100, box)).toEqual([]);
    expect(chartPoints([5], 100, box)).toEqual([{ x: 8, y: chartY(5, 100, box) }]);
    expect(chartY(150, 100, box)).toBe(14);
    expect(chartY(-10, 100, box)).toBe(148);
    expect(chartY(5, 0, box)).toBe(148);
  });

  it("maximum mierky je väčšie z cieľa a hodnôt, s rezervou 5 %", () => {
    expect(chartMaxY([100, 200], 600)).toBeCloseTo(630, 9);
    expect(chartMaxY([100, 700], 600)).toBeCloseTo(735, 9);
    expect(chartMaxY([100, 200], null)).toBeCloseTo(210, 9);
  });
});
