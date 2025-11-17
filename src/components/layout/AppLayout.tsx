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
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 48,
          padding: "0 16px",
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
              padding: "4px 12px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              background: showEditor ? "#111827" : "#ffffff",
              color: showEditor ? "#f9fafb" : "#111827",
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
              border: "1px solid #e5e7eb",
              background: showSidepanel ? "#111827" : "#ffffff",
              color: showSidepanel ? "#f9fafb" : "#111827",
              cursor: "pointer"
            }}
          >
            {showSidepanel ? "Hide details" : "Show details"}
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
              borderRight: "1px solid #e5e7eb",
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
              borderLeft: "1px solid #e5e7eb",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "#ffffff"
            }}
          >
            {sidepanel}
          </div>
        )}
      </div>
    </div>
  );
};