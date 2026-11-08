import { useState } from "react";
import type { Person } from "../storage/types";

interface PersonFormProps {
  persons: Person[];
  onSave: (person: Person) => void;
  onCancel: () => void;
}

export function PersonForm({ persons, onSave, onCancel }: PersonFormProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("member");

  const handleSave = () => {
    if (!name.trim()) {
      alert("Meno je povinné");
      return;
    }

    const newPerson: Person = {
      id: `person-${Date.now()}`,
      name: name.trim(),
      role: role as "owner" | "member",
      isCurrentUser: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newPerson);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Nová osoba</h2>

      <label style={{ display: "block", margin: "12px 0" }}>
        <span style={{ fontSize: "14px", fontWeight: "bold" }}>Meno</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
        />
      </label>

      <label style={{ display: "block", margin: "12px 0" }}>
        <span style={{ fontSize: "14px", fontWeight: "bold" }}>Rola</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
        >
          <option value="member">Člen</option>
          <option value="owner">Vlastník</option>
        </select>
      </label>

      <div style={{ marginTop: "20px", display: "flex", gap: "8px" }}>
        <button onClick={handleSave} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Uložiť
        </button>
        <button onClick={onCancel} style={{ padding: "8px 16px", cursor: "pointer", background: "var(--muted)" }}>
          Zrušiť
        </button>
      </div>

      <div style={{ marginTop: "20px", fontSize: "12px", color: "var(--muted)" }}>
        <h4>Existujúce osoby ({persons.length})</h4>
        {persons.map((p) => (
          <div key={p.id} style={{ padding: "4px 0" }}>
            {p.name} ({p.role})
          </div>
        ))}
      </div>
    </div>
  );
}
