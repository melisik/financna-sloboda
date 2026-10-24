import { chartMaxY, chartPoints, chartY, type ChartBox } from "./chartGeometry";

const BOX: ChartBox = { width: 340, height: 170, left: 8, right: 8, top: 14, bottom: 22 };

/**
 * Čiarový graf bez knižnice (D-289, docs/44): hodnoty, voliteľná prerušovaná referenčná čiara (napr. cieľová suma)
 * a popisy začiatku, konca a poslednej hodnoty. Popis pre čítačky je v `label`; textová náhrada je tabuľka pri grafe.
 */
export function LineChart({ values, reference, referenceLabel, startLabel, endLabel, lastLabel, label }: {
  values: number[];
  reference: number | null;
  referenceLabel?: string;
  startLabel: string;
  endLabel: string;
  lastLabel: string;
  label: string;
}) {
  const maxY = chartMaxY(values, reference);
  const pts = chartPoints(values, maxY, BOX);
  const last = pts[pts.length - 1];
  const base = chartY(0, maxY, BOX);
  const text = { fill: "var(--muted)", fontSize: 11 };
  return (
    <svg viewBox={`0 0 ${BOX.width} ${BOX.height}`} width="100%" role="img" aria-label={label} style={{ display: "block", maxWidth: 560 }}>
      <line x1={BOX.left} x2={BOX.width - BOX.right} y1={base} y2={base} stroke="var(--border-soft)" />
      {reference !== null && (
        <>
          <line x1={BOX.left} x2={BOX.width - BOX.right} y1={chartY(reference, maxY, BOX)} y2={chartY(reference, maxY, BOX)} stroke="var(--muted)" strokeDasharray="4 4" />
          {referenceLabel && <text x={BOX.left} y={chartY(reference, maxY, BOX) - 4} style={text}>{referenceLabel}</text>}
        </>
      )}
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="var(--primary-bg)" strokeWidth={2.5} strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--primary-bg)" />)}
      {last && <text x={BOX.width - BOX.right} y={last.y - 8} textAnchor="end" style={{ ...text, fill: "var(--text)", fontWeight: 600 }}>{lastLabel}</text>}
      <text x={BOX.left} y={BOX.height - 6} style={text}>{startLabel}</text>
      <text x={BOX.width - BOX.right} y={BOX.height - 6} textAnchor="end" style={text}>{endLabel}</text>
    </svg>
  );
}
