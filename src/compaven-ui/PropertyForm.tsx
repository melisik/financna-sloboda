import { useState } from "react";
import type { Property, PropertyMode } from "../storage/types";
import { nanoid } from "nanoid";
import { isValidEurString, parseEurStrict } from "./propertyFormUtils";

export interface PropertyFormProps {
  property?: Property;
  onSave: (p: Property) => Promise<void>;
  onCancel: () => void;
  today: string;
}

const MODES: Array<{ value: PropertyMode; label: string }> = [
  { value: "vlastne_byvanie", label: "Vlastné bývanie" },
  { value: "prenajom", label: "Prenajom" },
  { value: "nezadane", label: "Nezadané" },
];

export function PropertyForm({ property, onSave, onCancel, today }: PropertyFormProps) {
  const [name, setName] = useState(property?.name ?? "");
  const [mode, setMode] = useState<PropertyMode>(property?.mode ?? "vlastne_byvanie");
  const [valueCents, setValueCents] = useState(property?.valueCents ?? 0);
  const [valueStr, setValueStr] = useState(
    typeof property?.valueCents === "number"
      ? (property.valueCents / 100).toFixed(2)
      : ""
  );
  const [valueDate, setValueDate] = useState(property?.valueDate ?? today);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const err: Record<string, string> = {};

    if (!name?.trim()) {
      err.name = "Vyplň názov";
    }

    if (!valueStr.trim()) {
      err.value = "Vyplň odhad hodnoty";
    } else if (!isValidEurString(valueStr)) {
      err.value = "Odhad musí byť číslo s maximálne 2 desatinnými miestami";
    }

    if (!valueDate) {
      err.valueDate = "Vyplň dátum";
    } else if (new Date(valueDate) > new Date(today)) {
      err.valueDate = "Dátum nesmie byť v budúcnosti";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const parsedCents = parseEurStrict(valueStr);
    if (parsedCents === null || Number.isNaN(parsedCents)) {
      setErrors({ value: "Neplatná hodnota" });
      return;
    }

    setSaving(true);
    try {
      const newProp: Property = {
        ...(property ?? {}),
        id: property?.id ?? nanoid(),
        name: name.trim(),
        mode,
        valueCents: parsedCents,
        valueDate,
        mortgageBalanceCents: property?.mortgageBalanceCents ?? 0,
        createdAt: property?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await onSave(newProp);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", maxWidth: "500px" }}>
      <h3>{property ? "Upraviť nehnuteľnosť" : "Pridať nehnuteľnosť"}</h3>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Názov</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Napr. Dom v Bratislave"
          maxLength={80}
          style={{
            width: "100%",
            padding: "8px",
            border: errors.name ? "1px solid red" : "1px solid #ddd",
            borderRadius: "4px",
            boxSizing: "border-box",
          }}
        />
        {errors.name && <span style={{ color: "red", fontSize: "12px" }}>{errors.name}</span>}
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Režim</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as PropertyMode)}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            boxSizing: "border-box",
          }}
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Odhad hodnoty (€)</label>
        <input
          type="text"
          inputMode="decimal"
          value={valueStr}
          onChange={(e) => setValueStr(e.target.value)}
          placeholder="napr. 1000.00"
          style={{
            width: "100%",
            padding: "8px",
            border: errors.value ? "1px solid red" : "1px solid #ddd",
            borderRadius: "4px",
            boxSizing: "border-box",
          }}
        />
        {errors.value && <span style={{ color: "red", fontSize: "12px" }}>{errors.value}</span>}
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>Dátum odhadu</label>
        <input
          type="date"
          value={valueDate}
          onChange={(e) => setValueDate(e.target.value)}
          max={today}
          style={{
            width: "100%",
            padding: "8px",
            border: errors.valueDate ? "1px solid red" : "1px solid #ddd",
            borderRadius: "4px",
            boxSizing: "border-box",
          }}
        />
        {errors.valueDate && <span style={{ color: "red", fontSize: "12px" }}>{errors.valueDate}</span>}
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ padding: "8px 16px", cursor: "pointer" }} disabled={saving}>
          Zrušiť
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          disabled={saving}
        >
          {saving ? "Ukladám..." : "Uložiť"}
        </button>
      </div>
    </div>
  );
}
