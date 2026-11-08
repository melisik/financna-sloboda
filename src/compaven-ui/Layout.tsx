import { useEffect, useState } from "react";
import { Navigation } from "./Navigation";

interface CompavenLayoutProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  children: React.ReactNode;
}

export function CompavenLayout({ currentPage, onPageChange, children }: CompavenLayoutProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarColor = "#F3F4F6";
  const textPrimary = "#111827";
  const textSecondary = "#6B7280";
  const accentColor = "#2563EB";
  const borderColor = "#E5E7EB";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        height: "100vh",
        backgroundColor: "#FAFBFC",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {!isMobile && (
        <div
          style={{
            width: 260,
            backgroundColor: sidebarColor,
            borderRight: `1px solid ${borderColor}`,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            padding: "24px 20px",
          }}
        >
          <div style={{ marginBottom: "32px" }}>
            <h1
              style={{
                color: accentColor,
                margin: "0",
                fontSize: "20px",
                fontWeight: "700",
                letterSpacing: "-0.5px",
              }}
            >
              COMPAVEN
            </h1>
            <p style={{ color: textSecondary, margin: "4px 0 0 0", fontSize: "12px" }}>2.0</p>
          </div>
          <Navigation currentPage={currentPage} onPageChange={onPageChange} layout="vertical" />
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {isMobile && (
          <header
            style={{
              backgroundColor: "#FFFFFF",
              borderBottom: `1px solid ${borderColor}`,
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h1 style={{ margin: "0", fontSize: "16px", fontWeight: "700", color: accentColor }}>
              COMPAVEN 2.0
            </h1>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: accentColor,
              }}
              aria-label="Toggle menu"
            >
              ☰
            </button>
          </header>
        )}

        {isMobile && menuOpen && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.3)",
              zIndex: 999,
            }}
            onClick={() => setMenuOpen(false)}
          >
            <nav
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "260px",
                height: "100vh",
                backgroundColor: sidebarColor,
                padding: "20px",
                overflowY: "auto",
                zIndex: 1000,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: "0", fontSize: "16px", fontWeight: "700", color: accentColor }}>Menu</h2>
                <button
                  onClick={() => setMenuOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: textSecondary,
                  }}
                >
                  ✕
                </button>
              </div>
              <Navigation
                currentPage={currentPage}
                onPageChange={(page) => {
                  onPageChange(page);
                  setMenuOpen(false);
                }}
                layout="vertical"
              />
            </nav>
          </div>
        )}

        <main style={{ flex: 1, overflowY: "auto", minWidth: "0" }}>{children}</main>
      </div>
    </div>
  );
}
