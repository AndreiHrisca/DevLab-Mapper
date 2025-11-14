// src/components/layout/AppLayout.tsx
import React from "react";

type AppLayoutProps = {
  editor: React.ReactNode;
  diagram: React.ReactNode;
  sidepanel: React.ReactNode;
  showEditor: boolean;
  showSidepanel: boolean;
  onToggleEditor: () => void;
  onToggleSidepanel: () => void;
};

export const AppLayout: React.FC<AppLayoutProps> = ({
  editor,
  diagram,
  sidepanel,
  showEditor,
  showSidepanel,
  onToggleEditor,
  onToggleSidepanel
}) => {
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 44,
          padding: "0 12px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f9fafb"
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14 }}>DevLab Mapper</div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onToggleEditor}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: showEditor ? "#111827" : "#ffffff",
              color: showEditor ? "#f9fafb" : "#111827",
              cursor: "pointer"
            }}
          >
            {showEditor ? "Ocultar JSON" : "Mostrar JSON"}
          </button>
          <button
            onClick={onToggleSidepanel}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: showSidepanel ? "#111827" : "#ffffff",
              color: showSidepanel ? "#f9fafb" : "#111827",
              cursor: "pointer"
            }}
          >
            {showSidepanel ? "Ocultar detalles" : "Mostrar detalles"}
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: `${
            showEditor ? "420px" : "0px"
          } 1fr ${showSidepanel ? "360px" : "0px"}`,
          minHeight: 0 // para que ReactFlow no se rompa
        }}
      >
        {/* Left panel (JSON) */}
        <div
          style={{
            borderRight: showEditor ? "1px solid #e5e7eb" : "none",
            overflow: "hidden",
            display: showEditor ? "block" : "none"
          }}
        >
          {editor}
        </div>

        {/* Center diagram */}
        <div
          style={{
            position: "relative",
            minWidth: 0 // importante para que ReactFlow calcule bien
          }}
        >
          {diagram}
        </div>

        {/* Right panel (Details) */}
        <div
          style={{
            borderLeft: showSidepanel ? "1px solid #e5e7eb" : "none",
            overflow: "hidden",
            display: showSidepanel ? "block" : "none"
          }}
        >
          {sidepanel}
        </div>
      </div>
    </div>
  );
};
