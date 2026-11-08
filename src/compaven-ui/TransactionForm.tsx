import { useState } from "react";
import type { Transaction } from "../storage/types";

interface TransactionFormProps {
  onSave: (transaction: Transaction) => void;
  onCancel: () => void;
}

export function TransactionForm({ onSave, onCancel }: TransactionFormProps) {
  const [type, setType] = useState<"sporenie" | "investicia" | "vydavok">("sporenie");
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  const handleSave = () => {
    if (amount <= 0) {
      alert("Suma musí byť väčšia ako 0");
      return;
    }

    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      date,
      type,
      amountCents: amount * 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (note) transaction.note = note;
    if (type === "vydavok") transaction.source = "z_prijmu";

    onSave(transaction);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Pridať transakciu</h2>

      <label style={{ display: "block", marginBottom: "12px" }}>
        <span style={{ fontWeight: "bold" }}>Typ</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
        >
          <option value="sporenie">Sporenie (hotovosť)</option>
          <option value="investicia">Investícia</option>
          <option value="vydavok">Výdavok</option>
        </select>
      </label>

      <label style={{ display: "block", marginBottom: "12px" }}>
        <span style={{ fontWeight: "bold" }}>Suma (€)</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
          min="0"
          step="0.01"
          style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
        />
      </label>

      <label style={{ display: "block", marginBottom: "12px" }}>
        <span style={{ fontWeight: "bold" }}>Dátum</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
        />
      </label>

      <label style={{ display: "block", marginBottom: "12px" }}>
        <span style={{ fontWeight: "bold" }}>Poznámka</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Voliteľná poznámka..."
          style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box", minHeight: "60px" }}
        />
      </label>

      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        <button onClick={handleSave} style={{ padding: "8px 16px", cursor: "pointer", background: "#2563EB", color: "white", border: "none", borderRadius: "4px" }}>
          Uložiť
        </button>
        <button onClick={onCancel} style={{ padding: "8px 16px", cursor: "pointer", background: "#6B7280", color: "white", border: "none", borderRadius: "4px" }}>
          Zrušiť
        </button>
      </div>
    </div>
  );
}
