// src/components/diagram/nodeTypes/ServiceNode.tsx
import React from "react";
import { Handle, Position } from "reactflow";

export const ServiceNode: React.FC<any> = ({ data }) => {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #2563eb",
        padding: "6px 10px",
        background: "linear-gradient(180deg,#eff6ff,#ffffff)",
        minWidth: 140,
        boxShadow: "0 4px 10px rgba(37,99,235,0.20)",
        display: "flex",
        flexDirection: "column",
        gap: 2
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#1d4ed8",
          display: "flex",
          alignItems: "center",
          gap: 6
        }}
      >
        <span>⚙️</span>
        <span>{data.label}</span>
      </div>
      {data.type && (
        <div
          style={{
            fontSize: 9,
            color: "#1e40af",
            background: "rgba(59,130,246,0.08)",
            borderRadius: 999,
            padding: "1px 6px",
            alignSelf: "flex-start"
          }}
        >
          {data.type}
        </div>
      )}

      {/* Handles laterales para que los edges parezcan salir de la caja/machine */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ left: -4, width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ right: -4, width: 8, height: 8 }}
      />
    </div>
  );
};
