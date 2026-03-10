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
  showEdges: boolean;
  edgeShape: "curved" | "straight";
  layoutMode: "manual" | "auto";
  onToggleEditEdges: () => void;
  onToggleEdgesVisibility: () => void;
  onToggleEdgeShape: () => void;
  onToggleLayoutMode: () => void;
  onResetEdges: () => void;
  onResetLayout: () => void;
  uiFontSize: number;
  onFontSizeChange: (delta: number) => void;
};

type ButtonTone = "default" | "accent" | "danger";

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
  showEdges,
  edgeShape,
  onToggleEditEdges,
  onToggleEdgesVisibility,
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
    shell: "var(--surface-1)",
    panel: "var(--surface-2)",
    panelAlt: "var(--surface-3)",
    border: "var(--border-color)",
    borderStrong: "var(--border-strong)",
    text: "var(--text-primary)",
    muted: "var(--text-muted)",
    secondary: "var(--text-secondary)",
    accent: "var(--accent)",
    accentStrong: "var(--accent-strong)",
    accentSoft: "var(--accent-soft)",
    accentContrast: "var(--accent-contrast)",
    info: "var(--info)",
    danger: "var(--danger)",
    shadow: "var(--shadow-soft)",
    strongShadow: "var(--shadow-strong)"
  };

  const [leftWidth, setLeftWidth] = useState(420);
  const [rightWidth, setRightWidth] = useState(320);

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

  const handleResize = (event: MouseEvent) => {
    if (!resizingSide.current) return;

    if (resizingSide.current === "left") {
      const newWidth = Math.max(
        260,
        Math.min(event.clientX - 12, window.innerWidth - 420)
      );
      setLeftWidth(newWidth);
    } else {
      const newWidth = window.innerWidth - event.clientX - 12;
      const clamped = Math.max(280, Math.min(newWidth, 640));
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

  const clusterStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: "fit-content",
    padding: "10px 12px",
    borderRadius: 18,
    border: `1px solid ${ui.border}`,
    background: ui.panel,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)"
  };

  const clusterLabelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: ui.muted
  };

  const buttonStyle = ({
    active = false,
    tone = "default",
    disabled = false,
    compact = false
  }: {
    active?: boolean;
    tone?: ButtonTone;
    disabled?: boolean;
    compact?: boolean;
  }): React.CSSProperties => {
    const palette =
      tone === "accent"
        ? {
            border: active ? ui.accentStrong : ui.borderStrong,
            background: active ? ui.accent : ui.panel,
            color: active ? ui.accentContrast : ui.text
          }
        : tone === "danger"
        ? {
            border: ui.borderStrong,
            background: active ? ui.danger : ui.panel,
            color: active ? "#fff5f5" : ui.text
          }
        : {
            border: active ? ui.info : ui.borderStrong,
            background: active ? ui.accentSoft : ui.panelAlt,
            color: ui.text
          };

    return {
      fontSize: compact ? 11 : 12,
      fontWeight: 600,
      padding: compact ? "6px 10px" : "7px 12px",
      borderRadius: 12,
      border: `1px solid ${palette.border}`,
      background: palette.background,
      color: palette.color,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      transition:
        "background-color 150ms ease, border-color 150ms ease, color 150ms ease, opacity 150ms ease"
    };
  };

  const resizerStyle: React.CSSProperties = {
    width: 10,
    cursor: "col-resize",
    background:
      "linear-gradient(to bottom, transparent 0%, rgba(148,163,184,0.25) 35%, rgba(148,163,184,0.4) 50%, rgba(148,163,184,0.25) 65%, transparent 100%)"
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 12,
        color: ui.text,
        fontSize: uiFontSize
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          padding: "14px 16px",
          borderRadius: 24,
          border: `1px solid ${ui.border}`,
          background: ui.shell,
          boxShadow: ui.shadow,
          backdropFilter: "blur(16px)"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 0.2
            }}
          >
            DevLab Mapper
          </div>
          <div
            style={{
              fontSize: 12,
              color: ui.secondary,
              maxWidth: 440
            }}
          >
            Explore the lab, adjust the diagram, and open details only when you
            need them.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "flex-end"
          }}
        >
          <div style={clusterStyle}>
            <div style={clusterLabelStyle}>Panels</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={onToggleEditor}
                style={buttonStyle({ active: showEditor, tone: "accent" })}
              >
                {showEditor ? "Hide JSON" : "Show JSON"}
              </button>
              <button
                onClick={onToggleSidepanel}
                style={buttonStyle({ active: showSidepanel, tone: "accent" })}
              >
                {showSidepanel ? "Hide details" : "Show details"}
              </button>
            </div>
          </div>

          <div style={clusterStyle}>
            <div style={clusterLabelStyle}>Connections</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={onToggleEdgesVisibility}
                style={buttonStyle({ active: !showEdges, tone: "accent" })}
              >
                {showEdges ? "Hide edges" : "Show edges"}
              </button>
              <button
                onClick={onToggleEditEdges}
                disabled={!showEdges}
                style={buttonStyle({
                  active: editEdgesMode,
                  disabled: !showEdges
                })}
              >
                {editEdgesMode ? "Finish editing" : "Adjust edges"}
              </button>
              <button
                onClick={onToggleEdgeShape}
                disabled={!showEdges}
                style={buttonStyle({ disabled: !showEdges })}
                title="Toggle curved or straight edges"
              >
                {edgeShape === "curved" ? "Curved path" : "Straight path"}
              </button>
              <button
                onClick={onResetEdges}
                disabled={!showEdges}
                style={buttonStyle({
                  disabled: !showEdges,
                  tone: "danger"
                })}
                title="Reset offsets and curvature"
              >
                Reset edges
              </button>
            </div>
          </div>

          <div style={clusterStyle}>
            <div style={clusterLabelStyle}>Diagram</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={onToggleLayoutMode}
                style={buttonStyle({
                  active: layoutMode === "auto"
                })}
                title="Toggle automatic and manual layout"
              >
                {layoutMode === "auto" ? "Auto layout" : "Manual layout"}
              </button>
              <button
                onClick={onResetLayout}
                style={buttonStyle({ tone: "danger" })}
                title="Reset node size and position"
              >
                Reset layout
              </button>
            </div>
          </div>

          <div style={clusterStyle}>
            <div style={clusterLabelStyle}>View</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => onFontSizeChange(-1)}
                style={buttonStyle({ compact: true })}
                title="Decrease font size"
              >
                A-
              </button>
              <button
                onClick={() => onFontSizeChange(1)}
                style={buttonStyle({ compact: true })}
                title="Increase font size"
              >
                A+
              </button>
              <button
                onClick={onToggleTheme}
                style={buttonStyle({ active: isDark })}
              >
                {isDark ? "Light theme" : "Dark theme"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          overflow: "hidden",
          borderRadius: 26,
          border: `1px solid ${ui.border}`,
          background: ui.panel,
          boxShadow: ui.strongShadow
        }}
      >
        {showEditor && (
          <div
            style={{
              width: leftWidth,
              minWidth: 260,
              maxWidth: 760,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: ui.panel
            }}
          >
            {editor}
          </div>
        )}

        {showEditor && <div onMouseDown={startLeftResize} style={resizerStyle} />}

        <div
          style={{
            flex: 1,
            minWidth: 0,
            position: "relative",
            background: ui.panel
          }}
        >
          {diagram}
        </div>

        {showSidepanel && <div onMouseDown={startRightResize} style={resizerStyle} />}

        {showSidepanel && (
          <div
            style={{
              width: rightWidth,
              minWidth: 280,
              maxWidth: 640,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: ui.panel
            }}
          >
            {sidepanel}
          </div>
        )}
      </div>
    </div>
  );
};
