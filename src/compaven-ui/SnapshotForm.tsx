import { useState } from "react";
import type { Snapshot, AppData } from "../storage/types";
import type { Repository } from "../storage/repository";
import { CSSProperties } from "react";
import { buildCompleteSnapshot } from "../app/snapshotBuilder";
import { validateSnapshotPreconditions } from "../app/snapshotValidator";
import { uid } from "../ui/kit/ids";

interface SnapshotFormProps {
  repo: Repository | null;
  data: AppData;
  onSave: (snapshot: Snapshot) => Promise<void>;
  onCancel: () => void;
}

export function SnapshotForm({ repo, data, onSave, onCancel }: SnapshotFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [investments, setInvestments] = useState(0);
  const [cash, setCash] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!date) {
        setError("Dátum je povinný");
        return;
      }

      if (investments < 0 || cash < 0) {
        setError("Investície a hotovosť nemôžu byť záporné");
        return;
      }

      // OPRAVA B.3: Vyžaduj čerstvé dáta z IndexedDB — bez fallback na staré dáta
      if (!repo) {
        setError("Úložisko nie je dostupné — snapshot nemôže byť vytvorený");
        return;
      }

      let currentData: AppData;
      try {
        const freshData = await repo.getData();
        if (!freshData) {
          setError("Chyba: Dáta nie sú dostupné z úložiska");
          return;
        }
        currentData = freshData;
      } catch (err) {
        setError(`Chyba pri čítaní dát z úložiska: ${String(err)}`);
        return;
      }

      // OPRAVA B: Spoločná validácia précondícií nad čerstvými údajmi
      const validationError = validateSnapshotPreconditions(currentData);
      if (validationError) {
        setError(validationError);
        return;
      }

      const snapshot = buildCompleteSnapshot({
        data: currentData,
        date,
        isAuto: false,
        id: `snapshot-${uid()}`,
        now: new Date().toISOString(),
        investmentsCents: Math.round(investments * 100),
        cashCents: Math.round(cash * 100),
      });

      if (!snapshot) {
        setError("Nepodarilo sa vytvoriť snapshot");
        return;
      }

      await onSave(snapshot);
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

  const metricBoxStyle: CSSProperties = {
    background: "#F9FAFB",
    borderRadius: "8px",
    padding: "16px",
    border: "1px solid #E5E7EB",
    marginBottom: "20px",
  };

  const metricLabelStyle: CSSProperties = {
    fontSize: "12px",
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    margin: "0 0 8px 0",
  };

  const metricValueStyle: CSSProperties = {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: "0",
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
          Prvé financné vyhodnotenie
        </h2>

        <p style={{ color: "#6B7280", lineHeight: "1.6", marginBottom: "24px" }}>
          Zaznamenajte svoj aktuálny investičný kapitál (K_FIRE). Výnosy sa budú automaticky sledovať a premietať do budúcich vyhodnotení.
        </p>

        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "12px", marginBottom: "24px", color: "#DC2626" }}>
            Chyba: {error}
          </div>
        )}

        {/* Dátum vyhodnotenia */}
        <div style={groupStyle}>
          <label style={labelStyle}>Dátum vyhodnotenia</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={inputStyle}
            disabled={loading}
          />
          <p style={{ fontSize: "12px", color: "#6B7280", margin: "6px 0 0 0" }}>
            Kedy ste robili záznam (štandardne dnes)
          </p>
        </div>

        <div style={{ ...metricBoxStyle, background: "#FFFBEB", borderColor: "#FDE68A" }}>
          <p style={metricLabelStyle}>Komponenty finančného kapitálu</p>
        </div>

        <div style={gridStyle}>
          {/* Investície */}
          <div style={groupStyle}>
            <label style={labelStyle}>Investície (K_inv) — €</label>
            <input
              type="number"
              value={investments}
              onChange={(e) => setInvestments(parseFloat(e.target.value) || 0)}
              style={inputStyle}
              placeholder="napr. 100000"
              disabled={loading}
            />
            <p style={{ fontSize: "12px", color: "#6B7280", margin: "6px 0 0 0" }}>
              Akcie, ETF, dlhopisy a iné investičné nástroje
            </p>
          </div>

          {/* Hotovosť */}
          <div style={groupStyle}>
            <label style={labelStyle}>Hotovosť (K_cash) — €</label>
            <input
              type="number"
              value={cash}
              onChange={(e) => setCash(parseFloat(e.target.value) || 0)}
              style={inputStyle}
              placeholder="napr. 50000"
              disabled={loading}
            />
            <p style={{ fontSize: "12px", color: "#6B7280", margin: "6px 0 0 0" }}>
              Sporiace účty, sporenie, nasporené financie
            </p>
          </div>
        </div>

        {/* Výpočet K_FIRE */}
        <div style={{ ...metricBoxStyle, background: "#F0F9FF", borderColor: "#BAE6FD" }}>
          <p style={metricLabelStyle}>Vaša investičná kapacita (K_FIRE)</p>
          <p style={metricValueStyle}>
            € {(investments + cash).toLocaleString("sk-SK")}
          </p>
          <p style={{ fontSize: "12px", color: "#6B7280", margin: "4px 0 0 0" }}>
            Investície + hotovosť (bez nehnuteľností)
          </p>
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
            {loading ? "Ukladám..." : "Uložiť vyhodnotenie"}
          </button>
        </div>
      </div>

      <p style={{ fontSize: "12px", color: "#6B7280", textAlign: "center", marginTop: "24px" }}>
        Vyhodnotenie je základ pre sledovanie pokroku k finančnej slobode. Môžete ho kedykoľvek aktualizovať.
      </p>
    </div>
  );
}
