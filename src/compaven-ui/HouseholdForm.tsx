import { useState } from "react";
import type { Household, SplitRule, HouseholdMember, Person, OwnerRef } from "../storage/types";
import { OwnershipEditor } from "./OwnershipEditor";

interface HouseholdFormProps {
  household: Household | null;
  persons: Person[];
  onSave: (household: Household) => void;
  onCancel: () => void;
}

export function HouseholdForm({ household, persons, onSave, onCancel }: HouseholdFormProps) {
  const getPersonName = (personId: string) => persons.find(p => p.id === personId)?.name ?? personId;
  const [name, setName] = useState(household?.name ?? "");
  const [splitKind, setSplitKind] = useState<"equal" | "income_ratio" | "custom">(household?.defaultSplitRule.kind ?? "equal");
  const [members, setMembers] = useState<HouseholdMember[]>(household?.members ?? []);
  const [selectedPersonId, setSelectedPersonId] = useState<string>("");
  const [ownership, setOwnership] = useState<OwnerRef[]>(
    members.filter(m => !m.leftAt).length === 1
      ? [{ personId: members.find(m => !m.leftAt)?.personId ?? "", percent: 100 }]
      : []
  );

  const handleAddMember = () => {
    if (!selectedPersonId) {
      alert("Vyberte osobu");
      return;
    }

    // Skontrolovať, či osoba nie je už členom
    if (members.some((m) => m.personId === selectedPersonId && !m.leftAt)) {
      alert("Táto osoba je už členom domácnosti");
      return;
    }

    const newMember: HouseholdMember = {
      personId: selectedPersonId,
      memberRole: "member",
      joinedAt: new Date().toISOString().split("T")[0],
    };
    setMembers([...members, newMember]);
    setSelectedPersonId("");
  };

  const handleRemoveMember = (index: number) => {
    setMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], leftAt: new Date().toISOString().split("T")[0] };
      return updated;
    });
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Názov domácnosti je povinný");
      return;
    }

    const newHousehold: Household = {
      id: household?.id ?? `h_${Date.now()}`,
      name: name.trim(),
      members: members.filter((m) => !m.leftAt), // Zachová aj odídených, keď sa uložia znova
      defaultSplitRule: { kind: splitKind as SplitRule["kind"] },
      createdAt: household?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newHousehold);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Domácnosť</h2>

      <label style={{ display: "block", margin: "12px 0" }}>
        <span style={{ fontSize: "14px", fontWeight: "bold" }}>Názov domácnosti</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
        />
      </label>

      <label style={{ display: "block", margin: "12px 0" }}>
        <span style={{ fontSize: "14px", fontWeight: "bold" }}>Rozdelenie výdavkov (default)</span>
        <select
          value={splitKind}
          onChange={(e) => setSplitKind(e.target.value as any)}
          style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
        >
          <option value="equal">Rovnomerne</option>
          <option value="income_ratio">Podľa príjmu</option>
          <option value="custom">Vlastné</option>
        </select>
      </label>

      <div style={{ margin: "12px 0" }}>
        <h3 style={{ fontSize: "16px" }}>Členovia ({members.filter(m => !m.leftAt).length})</h3>
        {members.map((m, i) => (
          !m.leftAt && (
            <div key={i} style={{ padding: "8px", border: "1px solid #ddd", borderRadius: "4px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{getPersonName(m.personId)}</strong> ({m.memberRole}) — od {m.joinedAt}
              </div>
              <button
                onClick={() => handleRemoveMember(i)}
                style={{ padding: "4px 8px", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
              >
                Odstrániť
              </button>
            </div>
          )
        ))}
        <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#f0f9ff", borderRadius: "4px" }}>
          <label style={{ display: "block", marginBottom: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: "bold" }}>Pridať člena</span>
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px", boxSizing: "border-box" }}
            >
              <option value="">— Vyberte osobu —</option>
              {persons
                .filter((p) => !members.some((m) => m.personId === p.id && !m.leftAt))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          <button
            onClick={handleAddMember}
            style={{ padding: "8px 16px", backgroundColor: "#dbeafe", border: "1px solid #93c5fd", borderRadius: "4px", cursor: "pointer" }}
          >
            Pridať
          </button>
        </div>
      </div>

      <div style={{ margin: "12px 0", padding: "12px", backgroundColor: "#fffacd", borderRadius: "4px", border: "1px solid #eee8a0" }}>
        <OwnershipEditor
          owners={ownership}
          availablePersons={persons}
          onSave={setOwnership}
          title="Vlastníctvo domácnosti (náhľad)"
        />
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        <button onClick={handleSave} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Uložiť
        </button>
        <button onClick={onCancel} style={{ padding: "8px 16px", cursor: "pointer", background: "var(--muted)" }}>
          Zrušiť
        </button>
      </div>
    </div>
  );
}
