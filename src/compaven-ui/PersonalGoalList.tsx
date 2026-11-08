import type { PersonalGoal } from "../storage/types";
import { CSSProperties } from "react";
import { formatMonths, analyzePersonalGoal, type PersonalGoalAnalysis } from "../domain/personalGoal";

interface PersonalGoalListProps {
  goals: PersonalGoal[];
  kInv: number;
  kCash: number;
  kNem: number;
  mInv: number;
  mCash: number;
  monthlyRate: number;
  onEdit?: (goal: PersonalGoal) => void;
  onDelete?: (goalId: string) => void;
}

export function PersonalGoalList({
  goals,
  kInv,
  kCash,
  kNem,
  mInv,
  mCash,
  monthlyRate,
  onEdit,
  onDelete,
}: PersonalGoalListProps) {
  const analyses: PersonalGoalAnalysis[] = goals.map((goal) =>
    analyzePersonalGoal(
      goal,
      goal.targetCents,
      kInv,
      kCash,
      kNem,
      mInv,
      mCash,
      monthlyRate,
    )
  );

  // Zosť podľa priority
  const sortedAnalyses = [...analyses].sort((a, b) => a.goal.priority - b.goal.priority);

  const containerStyle: CSSProperties = {
    background: "#FFFFFF",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  };

  const cardStyle: CSSProperties = {
    padding: "16px",
    borderBottom: "1px solid #E5E7EB",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    gap: "16px",
  };

  const lastCardStyle: CSSProperties = {
    ...cardStyle,
    borderBottom: "none",
  };

  const statusBadgeStyle = (classification: string): CSSProperties => {
    const baseStyle: CSSProperties = {
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: 600,
    };

    if (classification === "dosiahnutelny") {
      return { ...baseStyle, background: "#D1FAE5", color: "#065F46" };
    } else if (classification === "horizont_50plus") {
      return { ...baseStyle, background: "#FED7AA", color: "#92400E" };
    } else {
      return { ...baseStyle, background: "#FEE2E2", color: "#B91C1C" };
    }
  };

  const buttonGroupStyle: CSSProperties = {
    display: "flex",
    gap: "8px",
  };

  const buttonStyle: CSSProperties = {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
  };

  const deleteButtonStyle: CSSProperties = {
    ...buttonStyle,
    color: "#DC2626",
    borderColor: "#FECACA",
  };

  const emptyStyle: CSSProperties = {
    padding: "24px",
    textAlign: "center",
    color: "#6B7280",
  };

  if (goals.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={emptyStyle}>Zatiaľ nemáte žiadne finančné ciele. Pridajte svoj prvý cieľ!</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {sortedAnalyses.map((analysis, idx) => {
        const goal = analysis.goal;
        const isLast = idx === sortedAnalyses.length - 1;

        return (
          <div key={goal.id} style={isLast ? lastCardStyle : cardStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>
                    {goal.priority}. {goal.name}
                  </div>
                  <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>
                    Cieľ: {(goal.targetCents / 100).toFixed(2)} € do {goal.targetYear}
                    {goal.targetMonth && `/${String(goal.targetMonth).padStart(2, "0")}`}
                  </div>
                  {goal.monthlySavingCents && (
                    <div style={{ fontSize: "13px", color: "#059669" }}>
                      +{(goal.monthlySavingCents / 100).toFixed(2)} €/mesiacne
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span style={statusBadgeStyle(analysis.classification)}>
                  {analysis.classification === "dosiahnutelny"
                    ? "Dosiahnuteľný"
                    : analysis.classification === "horizont_50plus"
                      ? "Horizont 50+"
                      : "Nedosiahnuteľný"}
                </span>

                {analysis.monthsToTarget !== null && (
                  <span style={{ fontSize: "13px", color: "#6B7280" }}>
                    {formatMonths(analysis.monthsToTarget)}
                  </span>
                )}

                {goal.flexible && (
                  <span
                    style={{
                      fontSize: "12px",
                      background: "#EBF8FF",
                      color: "#0369A1",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    Flexibilný
                  </span>
                )}
              </div>

              {goal.note && (
                <div style={{ fontSize: "13px", color: "#6B7280", fontStyle: "italic" }}>
                  {goal.note}
                </div>
              )}
            </div>

            <div style={buttonGroupStyle}>
              {onEdit && (
                <button onClick={() => onEdit(goal)} style={buttonStyle} title="Upraviť">
                  ✏️
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(goal.id)} style={deleteButtonStyle} title="Zmazať">
                  🗑️
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
