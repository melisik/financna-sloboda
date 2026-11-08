import { CSSProperties } from "react";

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  layout: "vertical" | "horizontal";
}

const pages = [
  { id: "dashboard", icon: "📊", label: "Dashboard", color: "#2563EB" },
  { id: "household", icon: "👥", label: "Domácnosť", color: "#EC4899" },
  { id: "persons-form", icon: "👤", label: "Osoby", color: "#8B5CF6" },
  { id: "income", icon: "💰", label: "Príjmy & Výdavky", color: "#10B981" },
  { id: "assets", icon: "🏠", label: "Majetok & Záväzky", color: "#F59E0B" },
  { id: "goals", icon: "🎯", label: "Finančné ciele", color: "#8B5CF6" },
  { id: "analytics", icon: "📈", label: "História & Analýzy", color: "#EC4899" },
  { id: "planning", icon: "📋", label: "Plánovanie", color: "#06B6D4" },
  { id: "settings-form", icon: "⚙️", label: "Nastavenia", color: "#6B7280" },
];

export function Navigation({ currentPage, onPageChange, layout }: NavigationProps) {
  const isVertical = layout === "vertical";
  const textPrimary = "#111827";
  const textSecondary = "#6B7280";
  const borderColor = "#E5E7EB";
  const accentColor = "#2563EB";
  const hoverBg = "#FFFFFF";
  const activeBg = "#DDF4FF";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        gap: isVertical ? "8px" : "8px",
        flex: isVertical ? 1 : "initial",
      }}
    >
      {pages.map((page) => {
        const isActive = currentPage === page.id;

        const btnStyle: CSSProperties = {
          background: isActive ? activeBg : "transparent",
          color: isActive ? accentColor : textSecondary,
          border: isActive ? `1px solid ${accentColor}20` : "1px solid transparent",
          padding: isVertical ? "12px 16px" : "8px 12px",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: isVertical ? "14px" : "12px",
          fontWeight: isActive ? "600" : "500",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: isVertical ? "12px" : "6px",
          flexDirection: isVertical ? "row" : "column",
          width: isVertical ? "100%" : "auto",
          minWidth: isVertical ? "auto" : "60px",
          textAlign: isVertical ? "left" : "center",
          whiteSpace: "nowrap",
        };

        const labelStyle: CSSProperties = {
          fontSize: isVertical ? "14px" : "10px",
          marginTop: isVertical ? "0" : "2px",
          maxWidth: isVertical ? "none" : "50px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "normal",
          lineHeight: "1.2",
        };

        return (
          <button
            key={page.id}
            onClick={() => onPageChange(page.id)}
            style={btnStyle}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "#F9FAFB";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span style={{ fontSize: isVertical ? "18px" : "20px" }}>{page.icon}</span>
            <span style={labelStyle}>{page.label}</span>
          </button>
        );
      })}
    </div>
  );
}
