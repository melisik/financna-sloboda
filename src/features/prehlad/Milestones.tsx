import type { Milestone } from "../../domain/milestones";
import { card } from "../../ui/kit/controls";

/** Míľniky (D-344): informatívny prehľad pokroku – nie finančné odporúčania. */

export function MilestonesBlock({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return <p style={{ color: "var(--muted)", textAlign: "center" }}>Žiadne míľniky.</p>;
  }

  const reached = milestones.filter((m) => m.reached);
  const unreached = milestones.filter((m) => !m.reached);

  return (
    <div>
      {reached.length > 0 && (
        <div>
          <h3 style={{ margin: "8px 0", fontSize: "var(--font-body)" }}>
            Dosiahnuté ({reached.length})
          </h3>
          {reached.map((m) => (
            <div
              key={m.id}
              style={{
                ...card,
                marginBottom: 8,
                borderLeft: "4px solid var(--ok)",
              }}
            >
              <p style={{ margin: 0, fontWeight: 700 }}>{m.label}</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "var(--font-small)", color: "var(--ok)" }}>
                ✓ Dosiahnuté
              </p>
            </div>
          ))}
        </div>
      )}
      {unreached.length > 0 && (
        <div>
          <h3 style={{ margin: "8px 0", fontSize: "var(--font-body)" }}>
            Ďalšie ({unreached.length})
          </h3>
          {unreached.map((m) => (
            <div
              key={m.id}
              style={{
                ...card,
                marginBottom: 8,
                borderLeft: "4px solid var(--border-soft)",
                opacity: 0.7,
              }}
            >
              <p style={{ margin: 0, fontWeight: 700 }}>{m.label}</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "var(--font-small)", color: "var(--muted)" }}>
                Čakajúci cieľ
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
