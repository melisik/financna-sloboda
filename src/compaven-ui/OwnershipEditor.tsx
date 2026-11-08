import { useState } from "react";
import type { OwnerRef, Person } from "../storage/types";

interface OwnershipEditorProps {
  owners: OwnerRef[];
  availablePersons: Person[];
  onSave: (owners: OwnerRef[]) => void;
  title?: string;
}

export function OwnershipEditor({ owners, availablePersons, onSave, title = "Vlastníctvo" }: OwnershipEditorProps) {
  const [editedOwners, setEditedOwners] = useState<OwnerRef[]>(owners.length > 0 ? owners : []);
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [selectedPercent, setSelectedPercent] = useState<number>(100);

  const getPersonName = (personId: string) => {
    const person = availablePersons.find((p) => p.id === personId);
    return person?.name ?? personId;
  };

  const handleAddOwner = () => {
    if (!selectedPerson) {
      alert("Vyberte osobu");
      return;
    }
    if (editedOwners.find((o) => o.personId === selectedPerson)) {
      alert("Táto osoba je už vlastníkom");
      return;
    }

    const remaining = 100 - editedOwners.reduce((sum, o) => sum + o.percent, 0);
    const percent = Math.min(selectedPercent, remaining);

    if (percent <= 0) {
      alert("Nemožno pridať — vlastníctvo je už plne rozdelené");
      return;
    }

    setEditedOwners([...editedOwners, { personId: selectedPerson, percent }]);
    setSelectedPerson("");
    setSelectedPercent(Math.max(1, remaining - percent));
  };

  const handleRemoveOwner = (personId: string) => {
    setEditedOwners(editedOwners.filter((o) => o.personId !== personId));
  };

  const handlePercentChange = (personId: string, newPercent: number) => {
    const totalWithoutThis = editedOwners.reduce((sum, o) => (o.personId === personId ? sum : sum + o.percent), 0);
    const max = 100 - totalWithoutThis;

    setEditedOwners(
      editedOwners.map((o) => (o.personId === personId ? { ...o, percent: Math.min(newPercent, max) } : o)),
    );
  };

  const totalPercent = editedOwners.reduce((sum, o) => sum + o.percent, 0);
  const isValid = totalPercent === 100 && editedOwners.length > 0;

  return (
    <div style={{ fontFamily: "sans-serif", padding: "12px" }}>
      <h3>{title}</h3>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", margin: "8px 0" }}>
          <span style={{ fontSize: "14px", fontWeight: "bold" }}>Osoba</span>
          <select
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
          >
            <option value="">-- Vyberte --</option>
            {availablePersons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "block", margin: "8px 0" }}>
          <span style={{ fontSize: "14px", fontWeight: "bold" }}>Percent (%)</span>
          <input
            type="number"
            min="1"
            max="100"
            value={selectedPercent}
            onChange={(e) => setSelectedPercent(Math.max(1, Math.min(100, parseInt(e.target.value) || 0)))}
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
          />
        </label>

        <button onClick={handleAddOwner} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Pridať vlastníka
        </button>
      </div>

      <div style={{ padding: "12px", background: "var(--background, #f9f9f9)", borderRadius: "4px", marginBottom: "12px" }}>
        <strong>Vlastníci ({editedOwners.length}):</strong>
        {editedOwners.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Žiadni vlastníci</p>
        ) : (
          <div>
            {editedOwners.map((owner) => (
              <div
                key={owner.personId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px",
                  margin: "4px 0",
                  background: "white",
                  borderRadius: "4px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <span>
                  <strong>{getPersonName(owner.personId)}</strong>: {owner.percent}%
                </span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={owner.percent}
                    onChange={(e) => handlePercentChange(owner.personId, parseInt(e.target.value) || 0)}
                    style={{ width: "60px", padding: "4px" }}
                  />
                  <button
                    onClick={() => handleRemoveOwner(owner.personId)}
                    style={{
                      padding: "4px 8px",
                      cursor: "pointer",
                      background: "var(--danger, red)",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                    }}
                  >
                    Odstrániť
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: "12px", color: totalPercent === 100 ? "green" : "var(--danger, red)" }}>
          Spolu: {totalPercent}% {totalPercent !== 100 && `(chýba ${100 - totalPercent}%)`}
        </p>
      </div>

      <button
        onClick={() => onSave(editedOwners)}
        disabled={!isValid}
        style={{
          padding: "8px 16px",
          cursor: isValid ? "pointer" : "not-allowed",
          background: isValid ? "var(--primary, blue)" : "var(--muted, gray)",
          color: "white",
          border: "none",
          borderRadius: "4px",
        }}
      >
        Uložiť ({totalPercent}%)
      </button>
    </div>
  );
}
