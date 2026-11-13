import { getEnvironmentConfig } from "../config/environment";

export function TestModeIndicator() {
  // PHASE 1A: Používaj centrálnu konfiguráciu (build-time VITE_COMPAVEN_ENV)
  const envConfig = getEnvironmentConfig();

  if (!envConfig.isSandboxEnv) {
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
        <strong>SANDBOX PROSTREDIE ({envConfig.dbName})</strong>
        <div style={{ fontSize: "12px", marginTop: "2px", opacity: 0.8 }}>
          Toto je TESTOVACIA INŠTANCIA. Produkčné dáta (REAL) ostávajú nedotknuté.
        </div>
      </div>
    </div>
  );
}
