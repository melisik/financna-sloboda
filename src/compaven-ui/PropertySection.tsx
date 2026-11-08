import { useState } from "react";
import type { Property } from "../storage/types";
import type { Repository } from "../storage/repository";
import { PropertyForm } from "./PropertyForm";

export interface PropertySectionProps {
  repo: Repository;
  properties: Property[];
  today: string;
  onSaved: () => void;
}

export function PropertySection({ repo, properties, today, onSaved }: PropertySectionProps) {
  const [editing, setEditing] = useState<Property | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Property | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (property: Property) => {
    setEditing(property);
    setShowForm(true);
  };

  const handleSave = async (property: Property) => {
    await repo.saveProperty(property);
    setShowForm(false);
    setEditing(null);
    onSaved();
  };

  const handleDeleteClick = (property: Property) => {
    setDeleteConfirm(property);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    await repo.deleteProperty(deleteConfirm.id);
    setDeleteConfirm(null);
    onSaved();
  };

  const formatEur = (cents: number): string => {
    return (cents / 100).toFixed(2);
  };

  const netPropertyValue = (property: Property): number => {
    const value = property.valueCents || 0;
    const mortgage = property.mortgageBalanceCents || 0;
    return value - mortgage;
  };

  return (
    <div style={{ padding: "16px" }}>
      <h2>Majetok & Záväzky</h2>

      {showForm && (
        <div style={{ marginBottom: "24px" }}>
          <PropertyForm
            property={editing ?? undefined}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
            today={today}
          />
        </div>
      )}

      {deleteConfirm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "8px",
            maxWidth: "400px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>
            <h3>Potvrdiť vymazanie</h3>
            <p>Naozaj chceš zmazať nehnuteľnosť "{deleteConfirm.name}"?</p>
            <p style={{ fontSize: "12px", color: "#666" }}>Táto akcia sa nedá vrátiť.</p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ padding: "8px 16px", cursor: "pointer" }}
              >
                Zrušiť
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  padding: "8px 16px",
                  background: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Zmazať
              </button>
            </div>
          </div>
        </div>
      )}

      {properties.length === 0 ? (
        <div style={{
          padding: "40px 20px",
          textAlign: "center",
          background: "#f9f9f9",
          borderRadius: "8px",
          border: "1px solid #ddd",
        }}>
          <p style={{ color: "#666", marginBottom: "16px" }}>
            Zatiaľ nie je zapísaná žiadna nehnuteľnosť.
          </p>
          <button
            onClick={handleAdd}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Pridať nehnuteľnosť
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={handleAdd}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "16px",
            }}
          >
            + Pridať nehnuteľnosť
          </button>

          <div style={{ display: "grid", gap: "12px" }}>
            {properties.map((prop) => (
              <div
                key={prop.id}
                style={{
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  background: "#f9f9f9",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 4px 0" }}>{prop.name}</h4>
                    <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#666" }}>
                      Režim: <strong>{prop.mode}</strong>
                    </p>
                    <p style={{ margin: "0 0 4px 0", fontSize: "12px" }}>
                      Odhad: <strong>{formatEur(prop.valueCents || 0)} €</strong>
                    </p>
                    <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#666" }}>
                      Dátum: {prop.valueDate}
                    </p>
                    <p style={{ margin: "0", fontSize: "12px", color: "#28a745", fontWeight: "bold" }}>
                      Čistá hodnota (K_nem príspevok): {formatEur(netPropertyValue(prop))} €
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleEdit(prop)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Upraviť
                    </button>
                    <button
                      onClick={() => handleDeleteClick(prop)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Zmazať
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
