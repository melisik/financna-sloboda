import { useState } from "react";
import type { AppData, PersonalGoal } from "../storage/types";
import type { Ctx } from "../domain/context";
import type { Repository } from "../storage/repository";
import { CSSProperties } from "react";
import { PersonalGoalForm } from "./PersonalGoalForm";
import { PersonalGoalList } from "./PersonalGoalList";
import { DeleteGoalDialog } from "./DeleteGoalDialog";

interface PersonalGoalsPageProps {
  data: AppData;
  ctx: Ctx;
  repo: Repository;
  onGoalsUpdated: () => Promise<void>;
  onCancel: () => void;
}

export function PersonalGoalsPage({
  data,
  ctx,
  repo,
  onGoalsUpdated,
  onCancel,
}: PersonalGoalsPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PersonalGoal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleAddGoal = () => {
    setEditingGoal(null);
    setShowForm(true);
  };

  const handleEditGoal = (goal: PersonalGoal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleSaveGoal = async (goal: PersonalGoal) => {
    try {
      setLoading(true);
      setError(null);
      await repo.savePersonalGoal(goal);
      await onGoalsUpdated();
      setShowForm(false);
      setEditingGoal(null);
    } catch (err) {
      setError(`Chyba pri uložení cieľa: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    const goal = (data.personalGoals ?? []).find((g) => g.id === goalId);
    if (goal) {
      setGoalToDelete({ id: goalId, name: goal.name });
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!goalToDelete) return;
    try {
      setLoading(true);
      setError(null);
      await repo.deletePersonalGoal(goalToDelete.id);
      await onGoalsUpdated();
      setDeleteDialogOpen(false);
      setGoalToDelete(null);
    } catch (err) {
      setError(`Chyba pri mazaní cieľa: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setGoalToDelete(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingGoal(null);
    setError(null);
  };

  // Výpočet prekročenia disponibilného prebytku
  const totalMonthlyGoal = (data.personalGoals ?? []).reduce(
    (sum, g) => sum + (g.monthlySavingCents ?? 0),
    0
  );
  const surplus = totalMonthlyGoal - ctx.m;
  const surplusEur = surplus > 0 ? (surplus / 100).toFixed(2) : null;

  const pageStyle: CSSProperties = {
    padding: "32px",
    background: "#FAFBFC",
    minHeight: "100vh",
  };

  const sectionStyle: CSSProperties = {
    background: "#FFFFFF",
    borderRadius: "12px",
    padding: "24px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    marginBottom: "24px",
  };

  const titleStyle: CSSProperties = {
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 8px 0",
  };

  const subtitleStyle: CSSProperties = {
    fontSize: "14px",
    color: "#6B7280",
    margin: "0 0 24px 0",
  };

  const warningBannerStyle: CSSProperties = {
    background: "#FEF3C7",
    border: "1px solid #FCD34D",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
    color: "#92400E",
  };

  const errorBannerStyle: CSSProperties = {
    background: "#FEE2E2",
    border: "1px solid #FECACA",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
    color: "#B91C1C",
  };

  const buttonGroupStyle: CSSProperties = {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "24px",
  };

  const primaryButtonStyle: CSSProperties = {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    background: "#3B82F6",
    color: "#FFFFFF",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
  };

  const secondaryButtonStyle: CSSProperties = {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    color: "#374151",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
  };

  const infoBoxStyle: CSSProperties = {
    background: "#EBF8FF",
    border: "1px solid #BAE6FD",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "16px",
    fontSize: "13px",
    color: "#0369A1",
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={sectionStyle}>
        <h1 style={titleStyle}>Finančné ciele</h1>
        <p style={subtitleStyle}>
          Spravujte individuálne finančné ciele nezávisle od FIRE výpočtov. Ciele sa počítajú lineárnym modelom.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={errorBannerStyle}>
          <strong>⚠️ Chyba:</strong> {error}
        </div>
      )}

      {/* Surplus Warning */}
      {surplusEur && (
        <div style={warningBannerStyle}>
          <strong>⚠️ Upozornenie:</strong> Príspevky na individuálne ciele ({(totalMonthlyGoal / 100).toFixed(2)} €)
          prekročia dostupný mesačný prebytok ({(ctx.m / 100).toFixed(2)} €) o <strong>{surplusEur} €</strong>.
          Toto je iba informácia; príspevky môžu byť upravené podľa potreby.
        </div>
      )}

      {/* Info Box */}
      <div style={infoBoxStyle}>
        💡 Lineárny model: K(n) = K0 + mGoal × n. Individuálne ciele neovplyvňujú mCash, mInv ani FIRE horizont.
      </div>

      {/* Form or List */}
      {showForm ? (
        <div style={sectionStyle}>
          <PersonalGoalForm
            goal={editingGoal ?? undefined}
            onSave={handleSaveGoal}
            onCancel={handleCancelForm}
          />
        </div>
      ) : (
        <>
          {/* Goals List */}
          <div style={sectionStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#111827" }}>
                Zoznam cieľov ({(data.personalGoals ?? []).length})
              </h2>
              <button
                onClick={handleAddGoal}
                style={primaryButtonStyle}
                disabled={loading}
              >
                ➕ Nový cieľ
              </button>
            </div>

            <PersonalGoalList
              goals={data.personalGoals ?? []}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
            />
          </div>

          {/* Action Buttons */}
          <div style={buttonGroupStyle}>
            <button onClick={onCancel} style={secondaryButtonStyle} disabled={loading}>
              Zatvoriť
            </button>
          </div>
        </>
      )}

      {/* Delete Goal Dialog */}
      {deleteDialogOpen && goalToDelete && (
        <DeleteGoalDialog
          goalName={goalToDelete.name}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
