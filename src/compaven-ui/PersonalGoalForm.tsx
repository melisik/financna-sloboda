import { useState, useEffect } from "react";
import type { PersonalGoal, PersonalGoalCategory } from "../storage/types";
import { PERSONAL_GOAL_CATEGORIES } from "../storage/types";
import { monthsToPersonalGoalWithStatus, validatePersonalGoalDate, type PersonalGoalResult } from "../domain/personalGoal";
import { CSSProperties } from "react";

interface PersonalGoalFormProps {
  goal?: PersonalGoal;
  onSave: (goal: PersonalGoal) => Promise<void>;
  onCancel: () => void;
}

export function PersonalGoalForm({ goal, onSave, onCancel }: PersonalGoalFormProps) {
  const [name, setName] = useState(goal?.name ?? "");
  const [targetCents, setTargetCents] = useState((goal?.targetCents ?? 0) / 100);
  const [currentCapital, setCurrentCapital] = useState((goal?.currentCapitalCents ?? 0) / 100);
  const [category, setCategory] = useState<PersonalGoalCategory>(goal?.category ?? "dovolena");
  const [priority, setPriority] = useState(goal?.priority ?? 1);
  const [targetYear, setTargetYear] = useState(goal?.targetYear ?? new Date().getFullYear() + 1);
  const [targetMonth, setTargetMonth] = useState(goal?.targetMonth ?? 12);
  const [flexible, setFlexible] = useState(goal?.flexible ?? false);
  const [monthlySaving, setMonthlySaving] = useState((goal?.monthlySavingCents ?? 0) / 100);
  const [note, setNote] = useState(goal?.note ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalResult, setGoalResult] = useState<PersonalGoalResult | null>(null);

  // Výpočet odhadu pri zmene príspevku
  useEffect(() => {
    const result = monthsToPersonalGoalWithStatus(
      targetCents > 0 ? Math.round(targetCents * 100) : undefined,
      currentCapital >= 0 ? Math.round(currentCapital * 100) : undefined,
      monthlySaving > 0 ? Math.round(monthlySaving * 100) : undefined,
    );
    setGoalResult(result);
  }, [targetCents, currentCapital, monthlySaving]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!name.trim()) {
        setError("Názov cieľa je povinný");
        return;
      }

      if (targetCents <= 0) {
        setError("Cieľová suma musí byť kladná");
        return;
      }

      if (priority <= 0) {
        setError("Priorita musí byť kladné číslo");
        return;
      }

      if (currentCapital < 0) {
        setError("Aktuálne vyčlenený kapitál nesmie byť záporný");
        return;
      }

      // Validácia dátumu
      const dateValidation = validatePersonalGoalDate(targetYear, targetMonth);
      if (!dateValidation.valid) {
        setError(dateValidation.reason || "Chyba v dátume");
        return;
      }

      // Varovanie pri nedosiahnuteľnosti (bez blokovania uloženia)
      if (goalResult && goalResult.status === "impossible") {
        const confirmed = window.confirm(
          `${goalResult.reason}\n\nChcete cieľ predsa uložiť?`
        );
        if (!confirmed) return;
      }

      const newGoal: PersonalGoal = {
        id: goal?.id ?? crypto.randomUUID(),
        name: name.trim(),
        targetCents: Math.round(targetCents * 100),
        currentCapitalCents: currentCapital > 0 ? Math.round(currentCapital * 100) : undefined,
        category,
        priority,
        targetYear,
        targetMonth,
        flexible,
        monthlySavingCents: monthlySaving > 0 ? Math.round(monthlySaving * 100) : undefined,
        note: note.trim() || undefined,
        createdAt: goal?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(newGoal);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const sectionStyle: CSSProperties = {
    background: "#FFFFFF",
    borderRadius: "12px",
    padding: "24px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    marginBottom: "24px",
  };

  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "12px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontFamily: "inherit",
    fontSize: "16px",
  };

  const labelStyle: CSSProperties = {
    display: "block",
    marginBottom: "8px",
    fontWeight: 600,
    color: "#374151",
  };

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  };

  const buttonStyle: CSSProperties = {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
  };

  const primaryButtonStyle: CSSProperties = {
    ...buttonStyle,
    background: "#3B82F6",
    color: "#FFFFFF",
  };

  const cancelButtonStyle: CSSProperties = {
    ...buttonStyle,
    background: "#E5E7EB",
    color: "#374151",
  };

  return (
    <div style={sectionStyle}>
      <h2 style={{ marginTop: 0 }}>{goal ? "Upraviť cieľ" : "Nový finančný cieľ"}</h2>

      {error && (
        <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "8px", padding: "12px", marginBottom: "16px", color: "#B91C1C" }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Názov cieľa *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="napr. Dovolenka, Dom, Auto..."
          style={inputStyle}
          maxLength={120}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>Cieľová suma (€) *</label>
          <input
            type="number"
            value={targetCents}
            onChange={(e) => setTargetCents(Number(e.target.value))}
            placeholder="10000"
            style={inputStyle}
            min="0"
            step="100"
          />
        </div>

        <div>
          <label style={labelStyle}>Aktuálne vyčlenený kapitál (€)</label>
          <input
            type="number"
            value={currentCapital}
            onChange={(e) => setCurrentCapital(Number(e.target.value))}
            placeholder="0"
            style={inputStyle}
            min="0"
            step="100"
          />
          <small style={{ display: "block", marginTop: "4px", color: "#6B7280" }}>Už vyčlenený kapitál na tento cieľ (K0).</small>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>Kategória *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as PersonalGoalCategory)} style={inputStyle}>
            {PERSONAL_GOAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>Priorita *</label>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            style={inputStyle}
            min="1"
            max="100"
          />
        </div>

        <div>
          <label style={labelStyle}>Rok dosiahnutia *</label>
          <input
            type="number"
            value={targetYear}
            onChange={(e) => setTargetYear(Number(e.target.value))}
            style={inputStyle}
            min="2026"
            max="2100"
          />
        </div>

        <div>
          <label style={labelStyle}>Mesiac (1-12)</label>
          <input
            type="number"
            value={targetMonth}
            onChange={(e) => setTargetMonth(Number(e.target.value))}
            style={inputStyle}
            min="1"
            max="12"
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>Mesačný príspevek (€)</label>
          <input
            type="number"
            value={monthlySaving}
            onChange={(e) => setMonthlySaving(Number(e.target.value))}
            placeholder="200"
            style={inputStyle}
            min="0"
            step="50"
          />
          <small style={{ display: "block", marginTop: "4px", color: "#6B7280" }}>Nepovinné. Ak je zadané, zvýši mesačné sporenie.</small>
        </div>

        <div>
          <label style={{ ...labelStyle, display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={flexible}
              onChange={(e) => setFlexible(e.target.checked)}
              style={{ marginRight: "8px", width: "20px", height: "20px", cursor: "pointer" }}
            />
            Flexibilný termín
          </label>
          <small style={{ display: "block", color: "#6B7280", marginLeft: "28px" }}>Umožní posunúť termín ak sa nedosiahne</small>
        </div>
      </div>

      {/* Odhad dosiahnutia */}
      {goalResult && (
        <div style={{
          background: goalResult.status === "achieved" ? "#D1FAE5" :
                     goalResult.status === "feasible" ? "#EBF8FF" :
                     goalResult.status === "long_horizon" ? "#FED7AA" :
                     goalResult.status === "impossible" ? "#FEE2E2" : "#F3F4F6",
          border: "1px solid " + (goalResult.status === "achieved" ? "#A7F3D0" :
                                  goalResult.status === "feasible" ? "#BAE6FD" :
                                  goalResult.status === "long_horizon" ? "#FDBA74" :
                                  goalResult.status === "impossible" ? "#FECACA" : "#D1D5DB"),
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "16px",
          fontSize: "14px",
          color: goalResult.status === "achieved" ? "#065F46" :
                goalResult.status === "feasible" ? "#0369A1" :
                goalResult.status === "long_horizon" ? "#92400E" :
                goalResult.status === "impossible" ? "#B91C1C" : "#374151"
        }}>
          <strong>📊 Odhad dosiahnutia:</strong> {goalResult.reason}
          {goalResult.targetDate && (
            <div style={{ marginTop: "4px" }}>
              <strong>Dátum:</strong> {goalResult.targetDate}
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Poznámka</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Voliteľná poznámka..."
          style={{ ...inputStyle, minHeight: "80px", fontFamily: "inherit" }}
          maxLength={300}
        />
      </div>

      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={cancelButtonStyle} disabled={loading}>
          Zrušiť
        </button>
        <button onClick={handleSave} style={primaryButtonStyle} disabled={loading}>
          {loading ? "Ukladám..." : "Uložiť"}
        </button>
      </div>
    </div>
  );
}
