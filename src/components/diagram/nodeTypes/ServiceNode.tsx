// src/components/diagram/nodeTypes/ServiceNode.tsx
import React from "react";
import { Handle, Position } from "reactflow";

type PortInfo = {
  port: number;
  protocol?: string;
  description?: string;
};

type ServiceNodeProps = {
  data: {
    label: string;
    type?: string;
    ports?: PortInfo[];
  };
};

export const ServiceNode: React.FC<ServiceNodeProps> = ({ data }) => {
  const { label, type, ports } = data;
  const mainPort = ports && ports.length > 0 ? ports[0] : undefined;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        boxSizing: "border-box"
      }}
    >
      {/* manejadores izquierda/derecha centrados verticalmente */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 8,
          height: 8,
          borderRadius: "999px",
          background: "#111827",
          border: "2px solid #f9fafb",
          left: -4
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 8,
          height: 8,
          borderRadius: "999px",
          background: "#111827",
          border: "2px solid #f9fafb",
          right: -4
        }}
      />

      {/* Carta del servicio, full-width dentro del nodo */}
      <div
        style={{
          width: "100%",
          borderRadius: 18,
          background: "#ffffff",
          border: "1.5px solid rgba(59,130,246,0.45)",
          boxShadow: "0 4px 10px rgba(15,23,42,0.10)",
          padding: "6px 10px 6px 10px",
          boxSizing: "border-box",
          fontSize: 10,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 11,
            marginBottom: 2,
            color: "#111827"
          }}
        >
          {label}
        </div>

        {mainPort && (
          <div style={{ lineHeight: 1.3, color: "#374151" }}>
            <span style={{ fontWeight: 600 }}>PORT:</span>{" "}
            {mainPort.port}
            {mainPort.protocol
              ? ` (${mainPort.protocol.toUpperCase()})`
              : ""}
            {mainPort.description ? ` – ${mainPort.description}` : ""}
          </div>
        )}

        {type && (
          <div
            style={{
              marginTop: 2,
              fontSize: 9,
              color: "#4b5563"
            }}
          >
            {type}
          </div>
        )}
      </div>
    </div>
  );
};