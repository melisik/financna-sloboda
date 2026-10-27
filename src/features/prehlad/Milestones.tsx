import { evaluateMilestones } from "../../domain/milestones";

interface Props {
  capitalCents: number;
  targetCents: number | null;
  annualExpensesCents: number;
}

/** Zobrazí dosiahnuté míľniky (D-344). Informatívne, nie finančné odporúčania. */
export function Milestones({ capitalCents, targetCents, annualExpensesCents }: Props) {
  const weeklyExpensesCents = annualExpensesCents > 0 ? Math.round(annualExpensesCents / 52) : 0;
  const milestones = evaluateMilestones(capitalCents, targetCents ?? 0, weeklyExpensesCents);
  const reached = milestones.filter((m) => m.reached);

  if (reached.length === 0) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ margin: "0 0 4px", fontSize: "var(--font-small)", color: "var(--muted)" }}>Dosiahnuté míľniky</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {reached.map((m) => (
          <li key={m.id} style={{ background: "var(--ok-bg)", padding: "3px 10px", borderRadius: 12, fontSize: "var(--font-small)" }}>
            ✓ {m.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
