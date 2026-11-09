import { CSSProperties } from "react";

interface DeleteGoalDialogProps {
  goalName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteGoalDialog({ goalName, onConfirm, onCancel }: DeleteGoalDialogProps) {
  const overlayStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const dialogStyle: CSSProperties = {
    background: "#FFFFFF",
    borderRadius: "12px",
    padding: "32px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  };

  const titleStyle: CSSProperties = {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 16px 0",
  };

  const messageStyle: CSSProperties = {
    fontSize: "14px",
    color: "#6B7280",
    margin: "0 0 24px 0",
    lineHeight: "1.5",
  };

  const buttonGroupStyle: CSSProperties = {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  };

  const cancelButtonStyle: CSSProperties = {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    color: "#374151",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
  };

  const deleteButtonStyle: CSSProperties = {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    background: "#DC2626",
    color: "#FFFFFF",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
  };

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div
        style={dialogStyle}
        onClick={(e) => e.stopPropagation()} // Zabrániť uzavretiu dialógu pri kliknutí na obsah
      >
        <h2 style={titleStyle}>Vymazať finančný cieľ?</h2>
        <p style={messageStyle}>
          Naozaj chcete vymazať cieľ „<strong>{goalName}</strong>"? Táto operácia sa nedá vrátiť späť.
        </p>

        <div style={buttonGroupStyle}>
          <button onClick={onCancel} style={cancelButtonStyle}>
            Zrušiť
          </button>
          <button onClick={onConfirm} style={deleteButtonStyle}>
            Vymazať cieľ
          </button>
        </div>
      </div>
    </div>
  );
}
