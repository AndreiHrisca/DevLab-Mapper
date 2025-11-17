// src/components/diagram/nodeTypes/MachineNode.tsx
import React from "react";
import { Handle, Position } from "reactflow";

type MachineStatus = "running" | "maintenance" | "deleted" | "disabled" | undefined;

type MachineNodeProps = {
  data: {
    label: string;
    os?: string;
    ip?: string;
    permissions?: string[];
    status?: MachineStatus;
    hasServices?: boolean;
    hasLibraries?: boolean;
  };
};

const statusPalette = {
  running: {
    border: "#16a34a",
    headerBg:
      "linear-gradient(90deg,rgba(22,163,74,0.18),rgba(5,150,105,0.08))",
    bodyBg: "rgba(236,253,245,0.6)",
    shadow: "0 8px 18px rgba(22,163,74,0.25)",
    pillBg: "rgba(22,163,74,0.12)",
    pillColor: "#166534"
  },
  maintenance: {
    border: "#f59e0b",
    headerBg:
      "linear-gradient(90deg,rgba(245,158,11,0.18),rgba(251,191,36,0.10))",
    bodyBg: "rgba(255,251,235,0.6)",
    shadow: "0 8px 18px rgba(245,158,11,0.25)",
    pillBg: "rgba(245,158,11,0.18)",
    pillColor: "#92400e"
  },
  deleted: {
    border: "#dc2626",
    headerBg:
      "linear-gradient(90deg,rgba(220,38,38,0.18),rgba(248,113,113,0.10))",
    bodyBg: "rgba(254,242,242,0.6)",
    shadow: "0 8px 18px rgba(220,38,38,0.28)",
    pillBg: "rgba(220,38,38,0.18)",
    pillColor: "#991b1b"
  },
  disabled: {
    border: "#6b7280",
    headerBg:
      "linear-gradient(90deg,rgba(107,114,128,0.20),rgba(148,163,184,0.12))",
    bodyBg: "rgba(243,244,246,0.6)",
    shadow: "0 8px 18px rgba(31,41,55,0.22)",
    pillBg: "rgba(107,114,128,0.18)",
    pillColor: "#374151"
  }
} as const;

export const MachineNode: React.FC<MachineNodeProps> = ({ data }) => {
  const {
    label,
    os,
    ip,
    permissions,
    status: rawStatus,
    hasServices,
    hasLibraries
  } = data;

  const permissionsText =
    permissions && permissions.length > 0 ? permissions.join(", ") : undefined;

  const normalizedStatus = (rawStatus ?? "running") as Exclude<
    MachineStatus,
    undefined
  >;

  const palette = statusPalette[normalizedStatus];

  const statusLabel =
    normalizedStatus === "running"
      ? "RUNNING"
      : normalizedStatus === "maintenance"
      ? "MAINTENANCE"
      : normalizedStatus === "deleted"
      ? "DELETED"
      : "DISABLED";

  // estilos reutilizables para la "tabla"
  const tableRowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "46px 6px 1fr", // col label, col ":", col valor
    alignItems: "baseline",
    fontSize: 9,
    padding: "1px 0"
  };

  const labelCellStyle: React.CSSProperties = {
    fontWeight: 700
  };

  const colonCellStyle: React.CSSProperties = {
    textAlign: "center",
    opacity: 0.9
  };

  const valueCellStyle: React.CSSProperties = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 20,
        border: `2px solid ${palette.border}`,
        backgroundColor: palette.bodyBg,
        boxShadow: palette.shadow,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        opacity: normalizedStatus === "disabled" ? 0.75 : 1
      }}
    >
      {/* Header máquina */}
      <div
        style={{
          padding: "6px 10px 8px 10px",
          borderBottom: `1px solid ${palette.border}20`,
          background: palette.headerBg,
          display: "flex",
          flexDirection: "column",
          gap: 4
        }}
      >
        {/* Primera línea: nombre + pill de status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#065f46",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>🖥</span>
            <span>{label}</span>
          </div>

          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              padding: "2px 8px",
              borderRadius: 999,
              background: palette.pillBg,
              color: palette.pillColor,
              border: `1px solid ${palette.pillColor}33`
            }}
          >
            {statusLabel}
          </div>
        </div>

        {/* Mini tabla OS / IP / Permissions */}
        {(os || ip || permissionsText) && (
          <div
            style={{
              marginTop: 4,
              borderRadius: 6,
              background: "rgba(255,255,255,0.45)",
              border: `1px solid ${palette.border}33`,
              padding: "4px 6px",
              color: "#065f46"
            }}
          >
            {os && (
              <div style={tableRowStyle}>
                <span style={labelCellStyle}>OS</span>
                <span style={colonCellStyle}>:</span>
                <span style={valueCellStyle}>{os}</span>
              </div>
            )}
            {ip && (
              <div style={tableRowStyle}>
                <span style={labelCellStyle}>IP</span>
                <span style={colonCellStyle}>:</span>
                <span style={valueCellStyle}>{ip}</span>
              </div>
            )}
            {permissionsText && (
              <div style={tableRowStyle}>
                <span style={labelCellStyle}>Perms</span>
                <span style={colonCellStyle}>:</span>
                <span style={valueCellStyle}>{permissionsText}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenido/secciones */}
      <div
        style={{
          flex: 1,
          padding: "6px 8px 8px 8px",
          fontSize: 10,
          color: "#047857",
          position: "relative"
        }}
      >
        {hasServices && (
          <div
            style={{
              position: "absolute",
              top: 6,
              left: 10,
              fontSize: 9,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: "#059669",
              opacity: 0.7,
              pointerEvents: "none"
            }}
          >
            Services
          </div>
        )}

        {hasLibraries && (
          <div
            style={{
              position: "absolute",
              bottom: 30,
              left: 10,
              fontSize: 9,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: "#4b5563",
              opacity: 0.7,
              pointerEvents: "none"
            }}
          >
            Libraries
          </div>
        )}

        {hasServices && hasLibraries && (
          <div
            style={{
              position: "absolute",
              left: 8,
              right: 8,
              borderTop: "1px dashed rgba(148,163,184,0.7)",
              top: "56%"
            }}
          />
        )}
      </div>

      <Handle
        type="source"
        position={Position.Top}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
    </div>
  );
};