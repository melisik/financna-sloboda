import { useState, useRef } from "react";
import type { Repository } from "../storage/repository";
import type { AppData } from "../storage/types";
import { buildBackup, parseBackup } from "../storage/backup";

interface BackupFormProps {
  repo: Repository;
  data: AppData;
  onRestored: () => void;
}

export function BackupForm({ repo, data, onRestored }: BackupFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      const backup = buildBackup(data, new Date().toISOString());
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `compaven-backup-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      setImportMessage("Záloha bola úspešne exportovaná.");
    } catch (err) {
      setError(`Chyba pri exporte: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      setError(null);
      setImportMessage(null);

      const file = event.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      const json = JSON.parse(text);
      const today = new Date().toISOString().split("T")[0];
      const result = parseBackup(json, today);

      if (!result.ok) {
        setError(`Chyby v zalohe:\n${result.errors.join("\n")}`);
        return;
      }

      // Potvrdenie pred obnovou
      const message = `Obnovenie bude obsahovať:
- Transakcie: ${result.counts?.transactions ?? 0}
- Vyhodnotenia: ${result.counts?.snapshots ?? 0}

Všetky aktuálne údaje budú nahradené!`;

      if (confirm(message)) {
        // Obnovenie
        await repo.replaceAll(result.data!);
        setImportMessage("✅ Záloha bola úspešne obnovená. Stránka sa bude obnoviť.");
        setTimeout(() => onRestored(), 1000);
      }
    } catch (err) {
      setError(`Chyba pri importe: ${String(err)}`);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>🔒 Zálohovanie a obnova dát</h2>

      <div style={{ marginBottom: "20px", padding: "12px", background: "#f0f9ff", borderRadius: "4px", borderLeft: "4px solid #2563EB" }}>
        <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>ℹ️ Bezpečnosť vašich finančných údajov</p>
        <p style={{ margin: 0, fontSize: "14px" }}>Pravidelne si exportujte zálohu a uchovajte si ju na bezpečnom mieste. Pri obnove budú všetky aktuálne údaje nahradené.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <button
          onClick={handleExport}
          disabled={loading}
          style={{
            padding: "12px 16px",
            background: "#10B981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          📥 Exportovať zálohu
        </button>

        <button
          onClick={handleImportClick}
          disabled={loading}
          style={{
            padding: "12px 16px",
            background: "#F59E0B",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          📤 Importovať zálohu
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        style={{ display: "none" }}
      />

      {error && <div style={{ padding: "12px", background: "#fee2e2", color: "#991b1b", borderRadius: "4px", marginBottom: "12px", whiteSpace: "pre-wrap" }}>{error}</div>}
      {importMessage && <div style={{ padding: "12px", background: "#dcfce7", color: "#166534", borderRadius: "4px" }}>{importMessage}</div>}
    </div>
  );
}
