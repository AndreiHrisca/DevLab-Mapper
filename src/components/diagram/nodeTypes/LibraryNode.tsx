// src/components/diagram/nodeTypes/LibraryNode.tsx
import React from "react";
import { Handle, Position } from "reactflow";

type LibraryNodeProps = {
  data: {
    label: string;
    version?: string;
    path?: string;
    theme?: "light" | "dark";
  };
};

export const LibraryNode: React.FC<LibraryNodeProps> = ({ data }) => {
  const { label, version, path, theme } = data;
  const isDark = theme === "dark";
  const cardBg = isDark ? "#0f172a" : "rgba(255,255,255,0.96)";
  const borderColor = isDark ? "1px dashed rgba(226,232,240,0.2)" : "1px dashed rgba(148,163,184,0.9)";
  const titleColor = isDark ? "#e2e8f0" : "#111827";
  const textColor = isDark ? "#cbd5e1" : "#111827";

  return (
    <div
      style={{
        width: "100%", // clave para ocupar todo el ancho que le pasa DiagramCanvas
        minHeight: 60,
        borderRadius: 18,
        border: borderColor,
        background: cardBg,
        padding: "6px 10px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontSize: 10,
        boxShadow: "0 2px 4px rgba(15,23,42,0.10)"
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 2, color: titleColor }}>{label}</div>
      {version && (
        <div style={{ color: textColor }}>
          <strong>Version:</strong> {version}
        </div>
      )}
      {path && (
        <div
          style={{
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
            color: textColor
          }}
        >
          <strong>Path:</strong> {path}
        </div>
      )}

      {/* Handles para edges */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 6, height: 6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 6, height: 6 }}
      />
    </div>
  );
};
