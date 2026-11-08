export function TestModeIndicator() {
  const dbName = localStorage.getItem("__COMPAVEN_DB_NAME__") || "unknown";
  const isTestMode = dbName === "compaven-2.0-test";

  if (!isTestMode) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#fff3cd",
        borderBottom: "2px solid #ffc107",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontFamily: "sans-serif",
        fontSize: "14px",
        color: "#856404",
      }}
    >
      <span style={{ fontSize: "18px" }}>⚠️</span>
      <div>
        <strong>TESTOVACIA DATABÁZA (compaven-2.0-test)</strong>
        <div style={{ fontSize: "12px", marginTop: "2px", opacity: 0.8 }}>
          Toto sú SYNTETICKÉ finančné dáta na testovanie. Produkčná databáza
          (compaven-2.0) ostáva nedotknutá.
        </div>
      </div>
    </div>
  );
}
