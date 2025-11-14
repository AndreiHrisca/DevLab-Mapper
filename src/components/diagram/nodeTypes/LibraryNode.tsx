// src/components/diagram/nodeTypes/LibraryNode.tsx
import React from "react";
import { Handle, Position } from "reactflow";

export const LibraryNode: React.FC<any> = ({ data }) => {
  return (
    <div
      style={{
        borderRadius: 999,
        border: "1px dashed #9ca3af",
        padding: "3px 10px",
        background: "#f9fafb",
        fontSize: 9,
        color: "#374151",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        boxShadow: "0 2px 4px rgba(148,163,184,0.25)"
      }}
    >
      <span>📦</span>
      <span>{data.label}</span>
      <Handle
        type="target"
        position={Position.Top}
        style={{ top: -4, width: 6, height: 6 }}
      />
    </div>
  );
};
