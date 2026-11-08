import type { AppData } from "../storage/types";
import type { Ctx } from "../domain/context";
import { CSSProperties } from "react";

interface DashboardProps {
  ctx: Ctx;
  data: AppData;
  onAddSettings?: () => void;
  onAddSnapshot?: () => void;
}

export function Dashboard({ ctx, data, onAddSettings, onAddSnapshot }: DashboardProps) {
  const hasSnapshot = !!ctx.latest;
  const hasSettings = !!data.settings;
  const kFire = ctx.K_FIRE / 100;
  const kTotal = ctx.K_total / 100;
  const kNem = ctx.K_nem / 100;
  const monthlyFlow = ctx.m / 100;
  const fireTargetCents = ctx.target || 1000000;
  const fireTargetEur = fireTargetCents / 100;

  const progressPercent = ctx.target && kFire > 0 ? Math.floor((kFire / fireTargetEur) * 100) : 0;
  const estimatedMonths = hasSnapshot && ctx.target && monthlyFlow > 0
    ? Math.ceil((fireTargetEur - kFire) / monthlyFlow)
    : 0;

  const colors = {
    bg: "#FAFBFC",
    surface: "#FFFFFF",
    border: "#E5E7EB",
    text: { primary: "#111827", secondary: "#6B7280", tertiary: "#9CA3AF" },
    accent: "#2563EB",
    success: "#10B981",
    warning: "#F59E0B",
  };

  const sectionStyle: CSSProperties = {
    background: colors.surface,
    borderRadius: "12px",
    padding: "24px",
    border: `1px solid ${colors.border}`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    marginBottom: "24px",
  };

  const sectionTitleStyle: CSSProperties = {
    fontSize: "16px",
    fontWeight: "600",
    color: colors.text.primary,
    margin: "0 0 20px 0",
    paddingBottom: "12px",
    borderBottom: `1px solid ${colors.border}`,
  };

  return (
    <div style={{ padding: "32px", background: colors.bg, minHeight: "100vh" }}>
      {/* EMPTY STATE */}
      {!hasSnapshot && (
        <>
          <div style={sectionStyle}>
            <h2 style={{ fontSize: "20px", color: colors.text.primary, margin: "0 0 12px 0" }}>
              Prvé kroky k finančnej slobode
            </h2>
            <p style={{ color: colors.text.secondary, margin: "0 0 20px 0", lineHeight: "1.6" }}>
              Vytvorte prvé financné vyhodnotenie. Zaznamenajte svoju aktuálnu finančnú situáciu — kapitál, majetok a výdavky.
              Po vyhodnotení budete vidieť presný prehľad a termín dosiahnutia cieľa.
            </p>

            {!hasSettings && (
              <div style={{ background: "#FEF3C7", borderRadius: "8px", padding: "16px", marginBottom: "12px", border: "1px solid #FCD34D" }}>
                <p style={{ fontSize: "14px", fontWeight: "600", color: "#92400E", margin: "0 0 8px 0" }}>
                  ⚠️ Nastavenia nie sú skonfigurované
                </p>
                <p style={{ fontSize: "13px", color: "#92400E", margin: "0 0 12px 0" }}>
                  Najprv nastavte finanční parametre: ročné výdavky, cieľ FIRE a očakávaný výnos.
                </p>
                <button
                  onClick={onAddSettings}
                  style={{
                    background: "#D97706",
                    color: "white",
                    padding: "10px 16px",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Nastaviť parametre
                </button>
              </div>
            )}

            {hasSettings && (
              <button
                onClick={onAddSnapshot}
                style={{
                  background: colors.accent,
                  color: "white",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Vytvoriť prvé vyhodnotenie
              </button>
            )}
          </div>
        </>
      )}

      {hasSnapshot && (
        <>
          {/* A. AKTUÁLNA FINANČNÁ SITUÁCIA */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Kde som teraz</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
              <MetricBox label="K_FIRE" value={kFire} subtitle="Investovateľný kapitál" color={colors.accent} />
              <MetricBox label="K_total" value={kTotal} subtitle="Celkový majetok" color={colors.success} />
              <MetricBox label="K_nem" value={kNem} subtitle="Nehnuteľnosti" color={colors.warning} />
              <MetricBox
                label="Mesačný tok"
                value={monthlyFlow}
                subtitle="Voľný peňažný tok (m)"
                color={colors.accent}
                isMoney={true}
              />
            </div>
          </div>

          {/* B. CESTA K FINANČNEJ SLOBODE */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Cesta k finančnej slobode</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <p style={{ fontSize: "13px", color: colors.text.secondary, margin: "0 0 8px 0", textTransform: "uppercase", fontWeight: "600" }}>
                  Pokrok
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "32px", fontWeight: "700", color: colors.accent, margin: "0" }}>
                      {progressPercent}%
                    </p>
                    <div style={{ marginTop: "12px", height: "8px", background: colors.border, borderRadius: "4px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          background: `linear-gradient(90deg, ${colors.accent}, ${colors.success})`,
                          width: `${Math.min(progressPercent, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p style={{ fontSize: "13px", color: colors.text.secondary, margin: "0 0 8px 0", textTransform: "uppercase", fontWeight: "600" }}>
                  Cieľ dosiahnutia
                </p>
                <p style={{ fontSize: "14px", color: colors.text.secondary, margin: "0 0 12px 0" }}>
                  {estimatedMonths > 0 ? (
                    <>
                      <span style={{ fontSize: "20px", fontWeight: "700", color: colors.text.primary }}>
                        {Math.floor(estimatedMonths / 12)}
                      </span>
                      <span style={{ fontSize: "14px" }}> rokov </span>
                      <span style={{ fontSize: "20px", fontWeight: "700", color: colors.text.primary }}>
                        {estimatedMonths % 12}
                      </span>
                      <span style={{ fontSize: "14px" }}> mesiacov</span>
                    </>
                  ) : (
                    "Potrebné údaje"
                  )}
                </p>
                <p style={{ fontSize: "12px", color: colors.text.tertiary, margin: "0" }}>
                  Cielová suma: € {fireTargetEur.toLocaleString("sk-SK")}
                </p>
              </div>
            </div>
          </div>

          {/* C. VÝVOJ MAJETKU */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Vývoj majetku v čase</h3>
            <p style={{ color: colors.text.secondary, fontSize: "14px", margin: "0" }}>
              Momentálne máte jedno vyhodnotenie. Viac vyhodnotení vám umožní sledovať vývoj vášho majetku.
            </p>
          </div>

          {/* D. ČO MÔŽEM UROBIŤ */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Čo ďalej</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              {data.transactions && data.transactions.length === 0 && (
                <ActionCard
                  icon="📊"
                  title="Registrovať transakcie"
                  description="Pridajte svoje prvé príjmy a výdavky"
                />
              )}
              {data.properties && data.properties.length === 0 && (
                <ActionCard
                  icon="🏠"
                  title="Zaregistrovať nehnuteľnosti"
                  description="Pridajte svoj majetok a záväzky"
                />
              )}
              {data.investments && data.investments.length === 0 && (
                <ActionCard
                  icon="📈"
                  title="Evidovať investície"
                  description="Sledujte svoje investičné pozície"
                />
              )}
              {monthlyFlow <= 0 && (
                <ActionCard
                  icon="💡"
                  title="Zvýšiť voľný peňažný tok"
                  description="Základ pre dosahnutie finančnej slobody"
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* DATA SUMMARY */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
        <StatTile icon="📊" label="Transakcie" count={data.transactions?.length || 0} />
        <StatTile icon="🏠" label="Nehnuteľnosti" count={data.properties?.length || 0} />
        <StatTile icon="📈" label="Investície" count={data.investments?.length || 0} />
        <StatTile icon="💳" label="Záväzky" count={data.liabilities?.length || 0} />
      </div>
    </div>
  );
}

function MetricBox({ label, value, subtitle, color, isMoney }: any) {
  return (
    <div style={{ background: "#FFFFFF", borderRadius: "12px", padding: "16px", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <p style={{ fontSize: "12px", fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px 0" }}>
        {label}
      </p>
      <p style={{ fontSize: "24px", fontWeight: "700", color: color, margin: "0 0 8px 0" }}>
        {isMoney ? "€" : ""} {Math.floor(value).toLocaleString("sk-SK")}
      </p>
      <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "0" }}>
        {subtitle}
      </p>
    </div>
  );
}

function ActionCard({ icon, title, description }: any) {
  return (
    <div style={{ background: "#F9FAFB", borderRadius: "8px", padding: "12px", border: "1px solid #E5E7EB", cursor: "pointer", transition: "all 0.2s" }}>
      <p style={{ fontSize: "20px", margin: "0 0 8px 0" }}>{icon}</p>
      <p style={{ fontSize: "14px", fontWeight: "600", color: "#111827", margin: "0 0 4px 0" }}>{title}</p>
      <p style={{ fontSize: "12px", color: "#6B7280", margin: "0" }}>{description}</p>
    </div>
  );
}

function StatTile({ icon, label, count }: any) {
  return (
    <div style={{ background: "#FFFFFF", borderRadius: "12px", padding: "16px", border: "1px solid #E5E7EB", textAlign: "center" }}>
      <p style={{ fontSize: "24px", margin: "0 0 8px 0" }}>{icon}</p>
      <p style={{ fontSize: "12px", color: "#6B7280", margin: "0 0 4px 0", fontWeight: "500" }}>{label}</p>
      <p style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: "0" }}>{count}</p>
    </div>
  );
}
