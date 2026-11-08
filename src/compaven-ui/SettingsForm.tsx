import { useState } from "react";
import type { Settings } from "../storage/types";
import { CSSProperties } from "react";

interface SettingsFormProps {
  settings: Settings | null;
  onSave: (settings: Settings) => Promise<void>;
  onCancel: () => void;
}

export function SettingsForm({ settings, onSave, onCancel }: SettingsFormProps) {
  const [expenses, setExpenses] = useState((settings?.expensesCents ?? 0) / 100); // sú v centoch, my v €
  const [withdrawalRate, setWithdrawalRate] = useState(settings?.withdrawalRate ?? 0.037);
  const [savingInv, setSavingInv] = useState((settings?.savingInvCents ?? 0) / 100);
  const [savingCash, setSavingCash] = useState((settings?.savingCashCents ?? 0) / 100);
  const [realReturn, setRealReturn] = useState(settings?.realReturn ?? 0.035);
  const [reserve, setReserve] = useState((settings?.reserveCents ?? 0) / 100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cieľ FIRE sa vypočítava automaticky: V / p
  const calculatedTarget = expenses / withdrawalRate;

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const newSettings: Settings = {
        expensesCents: Math.round(expenses * 100),
        savingInvCents: Math.round(savingInv * 100),
        savingCashCents: Math.round(savingCash * 100),
        realReturn,
        withdrawalRate,
        reserveCents: Math.round(reserve * 100),
        thresholdCents: 0,
        checkedAt: new Date().toISOString(),
      };

      await onSave(newSettings);
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
    fontSize: "14px",
    fontFamily: "inherit",
  };

  const labelStyle: CSSProperties = {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "6px",
  };

  const groupStyle: CSSProperties = {
    marginBottom: "20px",
  };

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  };

  const buttonContainerStyle: CSSProperties = {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "24px",
  };

  const buttonStyle: CSSProperties = {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const primaryButtonStyle: CSSProperties = {
    ...buttonStyle,
    background: "#2563EB",
    color: "white",
  };

  const secondaryButtonStyle: CSSProperties = {
    ...buttonStyle,
    background: "#F3F4F6",
    color: "#111827",
  };

  return (
    <div style={{ padding: "32px", background: "#FAFBFC", minHeight: "100vh" }}>
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "20px", color: "#111827", margin: "0 0 24px 0" }}>
          Finančné nastavenia
        </h2>

        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "12px", marginBottom: "24px", color: "#DC2626" }}>
            Chyba: {error}
          </div>
        )}

        <div style={gridStyle}>
          {/* Ročné výdavky (V) */}
          <div style={groupStyle}>
            <label style={labelStyle}>
              Ročné výdavky (V) — €
            </label>
            <input
              type="number"
              value={expenses}
              onChange={(e) => setExpenses(parseFloat(e.target.value) || 0)}
              style={inputStyle}
              placeholder="napr. 24000"
              disabled={loading}
            />
            <p style={{ fontSize: "12px", color: "#6B7280", margin: "6px 0 0 0" }}>
              Podľa rozpočtu (Nastavenia v Finančnej slobode)
            </p>
          </div>

          {/* Cieľ FIRE — automaticky vypočítaný */}
          <div style={groupStyle}>
            <label style={labelStyle}>
              Cieľ FIRE — € (automaticky)
            </label>
            <div style={{
              ...inputStyle,
              background: "#F9FAFB",
              color: "#6B7280",
              display: "flex",
              alignItems: "center",
            }}>
              € {calculatedTarget.toLocaleString("sk-SK", { maximumFractionDigits: 0 })}
            </div>
            <p style={{ fontSize: "12px", color: "#6B7280", margin: "6px 0 0 0" }}>
              Kapitál pre finančnú slobodu (= V ÷ p)
            </p>
          </div>

          {/* Mesačný príspevok na investície */}
          <div style={groupStyle}>
            <label style={labelStyle}>
              Mesačný príspevok na investície (c_inv) — €
            </label>
            <input
              type="number"
              value={savingInv}
              onChange={(e) => setSavingInv(parseFloat(e.target.value) || 0)}
              style={inputStyle}
              placeholder="napr. 1000"
              disabled={loading}
            />
            <p style={{ fontSize: "12px", color: "#6B7280", margin: "6px 0 0 0" }}>
              Plánovaný mesačný príspevok na investície
            </p>
          </div>

          {/* Mesačný príspevok na hotovosť */}
          <div style={groupStyle}>
            <label style={labelStyle}>
              Mesačný príspevok na hotovosť (c_cash) — €
            </label>
            <input
              type="number"
              value={savingCash}
              onChange={(e) => setSavingCash(parseFloat(e.target.value) || 0)}
              style={inputStyle}
              placeholder="napr. 500"
              disabled={loading}
            />
            <p style={{ fontSize: "12px", color: "#6B7280", margin: "6px 0 0 0" }}>
              Plánovaný mesačný príspevok na hotovosť/rezervu
            </p>
          </div>

          {/* Reálny výnos */}
          <div style={groupStyle}>
            <label style={labelStyle}>
              Reálny výnos (r) — %
            </label>
            <input
              type="number"
              value={realReturn * 100}
              onChange={(e) => setRealReturn((parseFloat(e.target.value) || 0) / 100)}
              style={inputStyle}
              placeholder="napr. 3.5"
              step="0.1"
              disabled={loading}
            />
            <p style={{ fontSize: "12px", color: "#6B7280", margin: "6px 0 0 0" }}>
              Očakávaný reálny ročný výnos (po inflácii)
            </p>
          </div>

          {/* Sadzba výberu */}
          <div style={groupStyle}>
            <label style={labelStyle}>
              Sadzba výberu (p) — %
            </label>
            <input
              type="number"
              value={withdrawalRate * 100}
              onChange={(e) => setWithdrawalRate((parseFloat(e.target.value) || 0) / 100)}
              style={inputStyle}
              placeholder="napr. 3.7"
              step="0.1"
              disabled={loading}
            />
            <p style={{ fontSize: "12px", color: "#6B7280", margin: "6px 0 0 0" }}>
              Bezpečná sadzba výberu z kapitálu (4% pravidlo)
            </p>
          </div>

          {/* Rezerva */}
          <div style={groupStyle}>
            <label style={labelStyle}>
              Minimálna rezerva — €
            </label>
            <input
              type="number"
              value={reserve}
              onChange={(e) => setReserve(parseFloat(e.target.value) || 0)}
              style={inputStyle}
              placeholder="napr. 5000"
              disabled={loading}
            />
            <p style={{ fontSize: "12px", color: "#6B7280", margin: "6px 0 0 0" }}>
              Bezpečná rezerva na neplánované výdavky
            </p>
          </div>
        </div>

        <div style={buttonContainerStyle}>
          <button
            onClick={onCancel}
            style={secondaryButtonStyle}
            disabled={loading}
          >
            Zrušiť
          </button>
          <button
            onClick={handleSave}
            style={primaryButtonStyle}
            disabled={loading}
          >
            {loading ? "Ukladám..." : "Uložiť nastavenia"}
          </button>
        </div>
      </div>

      <p style={{ fontSize: "12px", color: "#6B7280", textAlign: "center", marginTop: "24px" }}>
        Všetky údaje sa ukladajú do vlastnej databázy COMPAVEN 2.0.
      </p>
    </div>
  );
}
