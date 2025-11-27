// src/components/layout/AppLayout.tsx
import React, { useState, useRef, useEffect } from "react";

type AppLayoutProps = {
  editor: React.ReactNode;
  diagram: React.ReactNode;
  sidepanel: React.ReactNode;
  showEditor: boolean;
  showSidepanel: boolean;
  onToggleEditor: () => void;
  onToggleSidepanel: () => void;
  onToggleTheme: () => void;
  theme: "light" | "dark";
  editEdgesMode: boolean;
  edgeShape: "curved" | "straight";
  layoutMode: "manual" | "auto";
  onToggleEditEdges: () => void;
  onToggleEdgeShape: () => void;
  onToggleLayoutMode: () => void;
  onResetEdges: () => void;
  onResetLayout: () => void;
  uiFontSize: number;
  onFontSizeChange: (delta: number) => void;
};

export const AppLayout: React.FC<AppLayoutProps> = ({
  editor,
  diagram,
  sidepanel,
  showEditor,
  showSidepanel,
  onToggleEditor,
  onToggleSidepanel,
  onToggleTheme,
  theme,
  editEdgesMode,
  edgeShape,
  onToggleEditEdges,
  onToggleEdgeShape,
  layoutMode,
  onToggleLayoutMode,
  onResetEdges,
  onResetLayout,
  uiFontSize,
  onFontSizeChange
}) => {
  const isDark = theme === "dark";
  const ui = {
    bg: isDark ? "#0b1220" : "#f9fafb",
    fg: isDark ? "#e2e8f0" : "#111827",
    border: isDark ? "#1f2937" : "#e5e7eb",
    card: isDark ? "#0f172a" : "#ffffff",
    accent: isDark ? "#0ea5e9" : "#111827",
    buttonBg: isDark ? "#0f172a" : "#ffffff",
    buttonFg: isDark ? "#e2e8f0" : "#111827",
    buttonBorder: isDark ? "#1f2937" : "#e5e7eb"
  };
  // Anchos iniciales de paneles
  const [leftWidth, setLeftWidth] = useState(420);
  const [rightWidth, setRightWidth] = useState(240);

  const resizingSide = useRef<"left" | "right" | null>(null);

  const startLeftResize = () => {
    if (!showEditor) return;
    resizingSide.current = "left";
  };

  const startRightResize = () => {
    if (!showSidepanel) return;
    resizingSide.current = "right";
  };

  const stopResize = () => {
    resizingSide.current = null;
  };

  const handleResize = (e: MouseEvent) => {
    if (!resizingSide.current) return;

    if (resizingSide.current === "left") {
      // ancho = posición X del ratón
      const newWidth = Math.max(180, Math.min(e.clientX, window.innerWidth - 300));
      setLeftWidth(newWidth);
    } else if (resizingSide.current === "right") {
      // ancho = distancia desde borde derecho
      const newWidth = window.innerWidth - e.clientX;
      const clamped = Math.max(180, Math.min(newWidth, 600));
      setRightWidth(clamped);
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", stopResize);
    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", stopResize);
    };
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        background: ui.bg,
        color: ui.fg,
        fontSize: uiFontSize
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 48,
          padding: "0 16px",
          borderBottom: `1px solid ${ui.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: ui.bg
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14 }}>DevLab Mapper</div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onToggleEditor}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 999,
              border: `1px solid ${ui.buttonBorder}`,
              background: showEditor ? ui.accent : ui.buttonBg,
              color: showEditor ? "#f9fafb" : ui.buttonFg,
              cursor: "pointer"
            }}
          >
            {showEditor ? "Hide JSON" : "Show JSON"}
          </button>
          <button
            onClick={onToggleSidepanel}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 999,
              border: `1px solid ${ui.buttonBorder}`,
              background: showSidepanel ? ui.accent : ui.buttonBg,
              color: showSidepanel ? "#f9fafb" : ui.buttonFg,
              cursor: "pointer"
            }}
          >
            {showSidepanel ? "Hide details" : "Show details"}
          </button>
          <button
            onClick={onToggleEditEdges}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 999,
              border: `1px solid ${ui.buttonBorder}`,
              background: editEdgesMode ? ui.accent : ui.buttonBg,
              color: editEdgesMode ? "#f9fafb" : ui.buttonFg,
              cursor: "pointer"
            }}
          >
            {editEdgesMode ? "Done adjusting edges" : "Adjust edges"}
          </button>
          <button
            onClick={onToggleEdgeShape}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 999,
              border: `1px solid ${ui.buttonBorder}`,
              background: ui.buttonBg,
              color: ui.buttonFg,
              cursor: "pointer"
            }}
            title="Alterna entre edges curvos o rectos"
          >
            {edgeShape === "curved" ? "Edges: curved" : "Edges: straight"}
          </button>
          <button
            onClick={onToggleLayoutMode}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 999,
              border: `1px solid ${ui.buttonBorder}`,
              background: ui.buttonBg,
              color: ui.buttonFg,
              cursor: "pointer"
            }}
            title="Alterna entre distribución automática y manual"
          >
            {layoutMode === "auto" ? "Layout: auto" : "Layout: manual"}
          </button>
          <button
            onClick={onResetEdges}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 8,
              border: `1px solid ${ui.buttonBorder}`,
              background: ui.buttonBg,
              color: ui.buttonFg,
              cursor: "pointer"
            }}
            title="Reset edge offsets/curvas"
          >
            Reset edges
          </button>
          <button
            onClick={onResetLayout}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 8,
              border: `1px solid ${ui.buttonBorder}`,
              background: ui.buttonBg,
              color: ui.buttonFg,
              cursor: "pointer"
            }}
            title="Reset node sizes/positions"
          >
            Reset layout
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, opacity: 0.8 }}>Font</span>
            <button
              onClick={() => onFontSizeChange(-1)}
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 8,
                border: `1px solid ${ui.buttonBorder}`,
                background: ui.buttonBg,
                color: ui.buttonFg,
                cursor: "pointer"
              }}
              title="Disminuir tamaño de fuente"
            >
              A-
            </button>
            <button
              onClick={() => onFontSizeChange(1)}
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 8,
                border: `1px solid ${ui.buttonBorder}`,
                background: ui.buttonBg,
                color: ui.buttonFg,
                cursor: "pointer"
              }}
              title="Aumentar tamaño de fuente"
            >
              A+
            </button>
          </div>
          <button
            onClick={onToggleTheme}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 999,
              border: `1px solid ${ui.buttonBorder}`,
              background: ui.buttonBg,
              color: ui.buttonFg,
              cursor: "pointer"
            }}
          >
            {isDark ? "Light theme" : "Dark theme"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          width: "100%",
          minHeight: 0,
          overflow: "hidden"
        }}
      >
        {/* Panel izquierdo (JSON) */}
        {showEditor && (
          <div
            style={{
              width: leftWidth,
              minWidth: 20,
              maxWidth: 700,
              borderRight: `1px solid ${ui.border}`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {editor}
          </div>
        )}

        {/* Resizer izquierdo */}
        {showEditor && (
          <div
            onMouseDown={startLeftResize}
            style={{
              width: 6,
              cursor: "col-resize",
              background:
                "linear-gradient(to bottom, transparent 0%, #e5e7eb 50%, transparent 100%)"
            }}
          />
        )}

        {/* Diagrama central */}
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          {diagram}
        </div>

        {/* Resizer derecho */}
        {showSidepanel && (
          <div
            onMouseDown={startRightResize}
            style={{
              width: 6,
              cursor: "col-resize",
              background:
                "linear-gradient(to bottom, transparent 0%, #e5e7eb 50%, transparent 100%)"
            }}
          />
        )}

        {/* Panel derecho (Details) */}
        {showSidepanel && (
          <div
            style={{
              width: rightWidth,
              minWidth: 240,
              maxWidth: 600,
              borderLeft: `1px solid ${ui.border}`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: ui.card
            }}
          >
            {sidepanel}
          </div>
        )}
      </div>
    </div>
  );
};
