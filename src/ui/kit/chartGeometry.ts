/** Rozmery grafu v jednotkách viewBox; okraje sú miesto na popisy. */
export interface ChartBox {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ChartPoint {
  x: number;
  y: number;
}

/** Zvislá poloha hodnoty: 0 je spodok, maxY vrch; hodnoty mimo mierky ostanú v grafe (D-289). */
export function chartY(value: number, maxY: number, box: ChartBox): number {
  const bottom = box.height - box.bottom;
  if (!(maxY > 0)) return bottom;
  const share = Math.min(1, Math.max(0, value / maxY));
  return box.top + (bottom - box.top) * (1 - share);
}

/** Body čiarového grafu rovnomerne od ľavého po pravý okraj. */
export function chartPoints(values: number[], maxY: number, box: ChartBox): ChartPoint[] {
  const span = box.width - box.left - box.right;
  return values.map((v, i) => ({ x: box.left + (values.length > 1 ? (i * span) / (values.length - 1) : 0), y: chartY(v, maxY, box) }));
}

/** Vrch mierky: väčšie z referenčnej čiary (napr. cieľovej sumy) a hodnôt, s rezervou 5 % na popis. */
export function chartMaxY(values: number[], reference: number | null): number {
  return Math.max(reference ?? 0, ...values) * 1.05;
}
