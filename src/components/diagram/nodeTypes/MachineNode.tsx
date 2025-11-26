// src/components/diagram/nodeTypes/MachineNode.tsx
import React from "react";
import { Handle, Position, NodeResizer } from "reactflow";

type MachineStatus =
  | "running"
  | "maintenance"
  | "deleted"
  | "disabled"
  | undefined;

type MachineNodeProps = {
  data: {
    label: string;
    os?: string;
    ip?: string;
    permissions?: string[];
    status?: MachineStatus;

    // Metadata extra
    cpuCores?: number;
    ramGB?: number;
    datacenter?: string;
    rack?: string;
    zone?: string;
    tags?: string[];

    hasServices?: boolean;
    hasLibraries?: boolean;
    servicesAreaHeight?: number;
    librariesAreaHeight?: number;
    theme?: "light" | "dark";
    onResize?: (size: { width: number; height: number }) => void;
  };
  selected?: boolean;
};

const statusPalette = {
  running: {
    border: "#16a34a",
    headerBg:
      "linear-gradient(90deg,rgba(22,163,74,0.22),rgba(5,150,105,0.10))",
    bodyBg: "rgba(236,253,245,0.9)",
    shadow: "0 8px 18px rgba(22,163,74,0.25)",
    pillBg: "rgba(22,163,74,0.18)",
    pillColor: "#166534"
  },
  maintenance: {
    border: "#f59e0b",
    headerBg:
      "linear-gradient(90deg,rgba(245,158,11,0.22),rgba(251,191,36,0.12))",
    bodyBg: "rgba(255,251,235,0.9)",
    shadow: "0 8px 18px rgba(245,158,11,0.25)",
    pillBg: "rgba(245,158,11,0.20)",
    pillColor: "#92400e"
  },
  deleted: {
    border: "#dc2626",
    headerBg:
      "linear-gradient(90deg,rgba(220,38,38,0.22),rgba(248,113,113,0.12))",
    bodyBg: "rgba(254,242,242,0.9)",
    shadow: "0 8px 18px rgba(220,38,38,0.28)",
    pillBg: "rgba(220,38,38,0.20)",
    pillColor: "#991b1b"
  },
  disabled: {
    border: "#6b7280",
    headerBg:
      "linear-gradient(90deg,rgba(107,114,128,0.24),rgba(148,163,184,0.16))",
    bodyBg: "rgba(243,244,246,0.9)",
    shadow: "0 8px 18px rgba(31,41,55,0.22)",
    pillBg: "rgba(107,114,128,0.20)",
    pillColor: "#374151"
  }
} as const;

export const MachineNode: React.FC<MachineNodeProps> = ({ data, selected }) => {
  const {
    label,
    os,
    ip,
    permissions,
    status: rawStatus,
    cpuCores,
    ramGB,
    datacenter,
    rack,
    zone,
    tags,
    hasServices,
    hasLibraries,
    servicesAreaHeight,
    librariesAreaHeight,
    theme,
    onResize
  } = data;

  const isDark = theme === "dark";

  const normalizedStatus = ((): Exclude<MachineStatus, undefined> => {
    const candidate = rawStatus ?? "running";
    return ["running", "maintenance", "deleted", "disabled"].includes(
      candidate as string
    )
      ? (candidate as Exclude<MachineStatus, undefined>)
      : "running";
  })();

  const palette = statusPalette[normalizedStatus] ?? statusPalette.running;

  const statusLabel =
    normalizedStatus === "running"
      ? "RUNNING"
      : normalizedStatus === "maintenance"
      ? "MAINTENANCE"
      : normalizedStatus === "deleted"
      ? "DELETED"
      : "DISABLED";

  const permissionsText =
    permissions && permissions.length > 0 ? permissions.join(", ") : "-";

  const tagsText = tags && tags.length > 0 ? tags.join(", ") : "-";
  const baseBg = isDark ? "#0b1220" : palette.bodyBg;
  const headerBg = isDark ? `${palette.headerBg}, rgba(15,23,42,0.1)` : palette.headerBg;
  const textColor = isDark ? "#e2e8f0" : "#064e3b";
  const cardBg = isDark ? "#0f172a" : "rgba(255,255,255,0.95)";
  const cardBorder = isDark ? `1px solid rgba(226,232,240,0.2)` : "1px solid rgba(148,163,184,0.7)";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 24,
        border: `2px solid ${palette.border}`,
        backgroundColor: baseBg,
        boxShadow: palette.shadow,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
        opacity: 0.9,
        position: "relative"
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={360}
        minHeight={240}
        handleStyle={{
          width: 10,
          height: 10,
          borderRadius: 2,
          border: `1px solid ${palette.border}`,
          background: "#fff"
        }}
        lineStyle={{
          borderColor: `${palette.border}70`
        }}
        onResize={(_, params) => {
          onResize?.({
            width: params.width,
            height: params.height
          });
        }}
      />
      {/* HEADER -------------------------------------------------------------- */}
      <div
        style={{
          padding: "8px 16px",
          borderBottom: `1px solid ${palette.border}33`,
          background: headerBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box"
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: textColor,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <span>💻</span>
          <span>{label}</span>
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            padding: "2px 10px",
            borderRadius: 999,
            background: palette.pillBg,
            color: palette.pillColor,
            border: `1px solid ${palette.pillColor}40`
          }}
        >
          {statusLabel}
        </div>
      </div>

      {/* METADATA 2 COLUMNAS ------------------------------------------------- */}
      <div
        style={{
          padding: "10px 16px 8px 16px",
          borderBottom: `1px solid ${palette.border}33`,
          background: baseBg,
          boxSizing: "border-box"
        }}
      >
        <div
          style={{
            borderRadius: 18,
            border: `1px solid ${palette.border}55`,
            background: isDark ? "#0f172a" : "rgba(255,255,255,0.9)",
            padding: "8px 10px",
            fontSize: 10,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 16,
            rowGap: 4,
            boxSizing: "border-box"
          }}
        >
          {/* Columna izquierda */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px 6px 1fr",
              rowGap: 2,
              color: textColor
            }}
          >
            <span style={{ fontWeight: 600 }}>OS</span>
            <span>:</span>
            <span>{os ?? "-"}</span>

            <span style={{ fontWeight: 600 }}>IP</span>
            <span>:</span>
            <span>{ip ?? "-"}</span>

            <span style={{ fontWeight: 600 }}>Perms</span>
            <span>:</span>
            <span>{permissionsText}</span>

            <span style={{ fontWeight: 600 }}>Tags</span>
            <span>:</span>
            <span>{tagsText}</span>
          </div>

          {/* Columna derecha */}
          <div
              style={{
                display: "grid",
                gridTemplateColumns: "55px 6px 1fr",
                rowGap: 2,
                color: textColor
              }}
            >
            <span style={{ fontWeight: 600 }}>CPU</span>
            <span>:</span>
            <span>{cpuCores != null ? `${cpuCores} cores` : "-"}</span>

            <span style={{ fontWeight: 600 }}>RAM</span>
            <span>:</span>
            <span>{ramGB != null ? `${ramGB} GB` : "-"}</span>

            <span style={{ fontWeight: 600 }}>DC</span>
            <span>:</span>
            <span>{datacenter ?? "-"}</span>

            <span style={{ fontWeight: 600 }}>Rack</span>
            <span>:</span>
            <span>{rack ?? "-"}</span>

            <span style={{ fontWeight: 600 }}>Zone</span>
            <span>:</span>
            <span>{zone ?? "-"}</span>
          </div>
        </div>
      </div>

      {/* CUERPO: SERVICES | LIBRARIES ---------------------------------------- */}
      <div
        style={{
          flex: 1,
          padding: "10px 16px 12px 16px",
          display: "flex",
          gap: 12,
          boxSizing: "border-box"
        }}
      >
        {/* Columna SERVICES */}
        {hasServices && (
          <div
            style={{
              flex: 1,
              borderRadius: 16,
              border: isDark ? "1px solid rgba(226,232,240,0.15)" : "1px solid rgba(148,163,184,0.7)",
              background: cardBg,
              padding: "10px 10px 8px 10px",
              minHeight: servicesAreaHeight ?? 80,
              boxSizing: "border-box",
              position: "relative",
              boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
              overflowY: "auto"
            }}
          >
            {/* Header SERVICES con divider */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: "rgba(15,23,42,0.7)",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                paddingBottom: 4,
                marginBottom: 8
              }}
            >
              Services
            </div>
            {/* Los ServiceNode se colocan por coordenadas desde DiagramCanvas */}
          </div>
        )}

        {/* Columna LIBRARIES */}
        {hasLibraries && (
          <div
            style={{
              flex: 1,
              borderRadius: 16,
              border: isDark ? "1px dashed rgba(226,232,240,0.2)" : "1px dashed rgba(148,163,184,0.85)",
              background: cardBg,
              padding: "10px 10px 8px 10px",
              minHeight: librariesAreaHeight ?? 80,
              boxSizing: "border-box",
              position: "relative",
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              overflowY: "auto"
            }}
          >
            {/* Header LIBRARIES con divider */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: "rgba(15,23,42,0.7)",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                paddingBottom: 4,
                marginBottom: 8
              }}
            >
              Libraries
            </div>
            {/* Los LibraryNode se colocan por coordenadas desde DiagramCanvas */}
          </div>
        )}
      </div>

      {/* Handles máquina global (entrada izq, salida dcha) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
    </div>
  );
};
