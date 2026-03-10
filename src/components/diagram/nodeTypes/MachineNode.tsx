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
    detailsExpanded?: boolean;
    theme?: "light" | "dark";
    onResize?: (size: { width: number; height: number }) => void;
    onToggleDetails?: () => void;
  };
  selected: boolean;
};

const statusPalette = {
  running: {
    border: "#16a34a",
    glow: "0 18px 32px rgba(22, 163, 74, 0.18)",
    surface: "linear-gradient(180deg, rgba(240, 253, 244, 0.96), rgba(236, 253, 245, 0.88))",
    header: "linear-gradient(90deg, rgba(22, 163, 74, 0.22), rgba(16, 185, 129, 0.08))",
    pillBg: "rgba(22, 163, 74, 0.16)",
    pillText: "#166534"
  },
  maintenance: {
    border: "#f59e0b",
    glow: "0 18px 32px rgba(245, 158, 11, 0.18)",
    surface: "linear-gradient(180deg, rgba(255, 251, 235, 0.96), rgba(254, 243, 199, 0.86))",
    header: "linear-gradient(90deg, rgba(245, 158, 11, 0.22), rgba(251, 191, 36, 0.08))",
    pillBg: "rgba(245, 158, 11, 0.18)",
    pillText: "#92400e"
  },
  deleted: {
    border: "#dc2626",
    glow: "0 18px 32px rgba(220, 38, 38, 0.16)",
    surface: "linear-gradient(180deg, rgba(254, 242, 242, 0.96), rgba(254, 226, 226, 0.84))",
    header: "linear-gradient(90deg, rgba(220, 38, 38, 0.2), rgba(248, 113, 113, 0.08))",
    pillBg: "rgba(220, 38, 38, 0.16)",
    pillText: "#991b1b"
  },
  disabled: {
    border: "#64748b",
    glow: "0 18px 32px rgba(71, 85, 105, 0.16)",
    surface: "linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.84))",
    header: "linear-gradient(90deg, rgba(100, 116, 139, 0.22), rgba(148, 163, 184, 0.08))",
    pillBg: "rgba(100, 116, 139, 0.18)",
    pillText: "#334155"
  }
} as const;

const expandedMinHeight = 240;

function formatList(items?: string[]): string {
  return items && items.length > 0 ? items.join(", ") : "No data";
}

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
    detailsExpanded,
    theme,
    onResize,
    onToggleDetails
  } = data;

  const isDark = theme === "dark";
  const expanded = Boolean(detailsExpanded);

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

  const shellBg = isDark
    ? "linear-gradient(180deg, rgba(11, 18, 32, 0.98), rgba(15, 23, 42, 0.96))"
    : palette.surface;
  const headerBg = isDark
    ? "linear-gradient(90deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.72))"
    : palette.header;
  const textColor = isDark ? "#e2e8f0" : "#0f172a";
  const mutedColor = isDark ? "#9fb0c2" : "#4b5563";
  const sectionBg = isDark ? "rgba(15, 23, 42, 0.82)" : "rgba(255, 255, 255, 0.72)";
  const sectionBorder = isDark
    ? "1px solid rgba(148, 163, 184, 0.14)"
    : "1px solid rgba(148, 163, 184, 0.28)";
  const footerBg = isDark ? "rgba(8, 15, 28, 0.72)" : "rgba(255, 255, 255, 0.68)";
  const buttonBg = isDark ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.95)";
  const buttonBorder = isDark ? "#32455f" : "#c5d2de";

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleDetails?.();
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const infoCardStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "54px 1fr",
    gap: "6px 10px",
    padding: "10px 12px",
    borderRadius: 14,
    border: sectionBorder,
    background: sectionBg,
    fontSize: 10.5,
    lineHeight: 1.45
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 24,
        border: `2px solid ${palette.border}`,
        background: shellBg,
        boxShadow: selected
          ? `${palette.glow}, 0 0 0 2px ${palette.border}33`
          : palette.glow,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        transition:
          "box-shadow 160ms ease, border-color 160ms ease, transform 160ms ease"
      }}
    >
      <NodeResizer
        isVisible={Boolean(selected && expanded)}
        minWidth={360}
        minHeight={expandedMinHeight}
        handleStyle={{
          width: 10,
          height: 10,
          borderRadius: 3,
          border: `1px solid ${palette.border}`,
          background: "#ffffff"
        }}
        lineStyle={{
          borderColor: `${palette.border}60`
        }}
        onResize={(_, params) => {
          onResize?.({
            width: params.width,
            height: params.height
          });
        }}
      />

      <div
        style={{
          padding: "12px 16px",
          background: headerBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          borderBottom: expanded ? `1px solid ${palette.border}33` : "none"
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: textColor,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
          title={label}
        >
          {label}
        </div>
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: palette.pillBg,
            color: palette.pillText,
            border: `1px solid ${palette.pillText}22`,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.7,
            textTransform: "uppercase",
            flexShrink: 0
          }}
        >
          {statusLabel}
        </div>
      </div>

      <div
        style={{
          flex: expanded ? 1 : "0 0 auto",
          minHeight: 0,
          overflow: "hidden",
          maxHeight: expanded ? 720 : 0,
          opacity: expanded ? 1 : 0,
          transform: expanded ? "translateY(0)" : "translateY(-6px)",
          transition:
            "max-height 220ms ease, opacity 160ms ease, transform 180ms ease"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "12px 16px 10px"
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10
            }}
          >
            <div style={infoCardStyle}>
              <span style={{ fontWeight: 700, color: mutedColor }}>OS</span>
              <span style={{ color: textColor }}>{os ?? "No data"}</span>

              <span style={{ fontWeight: 700, color: mutedColor }}>IP</span>
              <span style={{ color: textColor }}>{ip ?? "No data"}</span>

              <span style={{ fontWeight: 700, color: mutedColor }}>Perms</span>
              <span style={{ color: textColor }}>{formatList(permissions)}</span>

              <span style={{ fontWeight: 700, color: mutedColor }}>Tags</span>
              <span style={{ color: textColor }}>{formatList(tags)}</span>
            </div>

            <div style={infoCardStyle}>
              <span style={{ fontWeight: 700, color: mutedColor }}>CPU</span>
              <span style={{ color: textColor }}>
                {cpuCores != null ? `${cpuCores} cores` : "No data"}
              </span>

              <span style={{ fontWeight: 700, color: mutedColor }}>RAM</span>
              <span style={{ color: textColor }}>
                {ramGB != null ? `${ramGB} GB` : "No data"}
              </span>

              <span style={{ fontWeight: 700, color: mutedColor }}>DC</span>
              <span style={{ color: textColor }}>{datacenter ?? "No data"}</span>

              <span style={{ fontWeight: 700, color: mutedColor }}>Rack</span>
              <span style={{ color: textColor }}>{rack ?? "No data"}</span>

              <span style={{ fontWeight: 700, color: mutedColor }}>Zone</span>
              <span style={{ color: textColor }}>{zone ?? "No data"}</span>
            </div>
          </div>

          {(hasServices || hasLibraries) && (
            <div
              style={{
                flex: 1,
                display: "flex",
                gap: 12,
                minHeight: 0
              }}
            >
              {hasServices && (
                <div
                  style={{
                    flex: 1,
                    minHeight: servicesAreaHeight ?? 80,
                    borderRadius: 16,
                    border: sectionBorder,
                    background: sectionBg,
                    padding: "10px 10px 8px",
                    overflowY: "auto"
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 0.7,
                      textTransform: "uppercase",
                      color: mutedColor,
                      borderBottom: `1px solid ${isDark ? "#32455f" : "rgba(148,163,184,0.35)"}`,
                      paddingBottom: 5,
                      marginBottom: 8
                    }}
                  >
                    Services
                  </div>
                </div>
              )}

              {hasLibraries && (
                <div
                  style={{
                    flex: 1,
                    minHeight: librariesAreaHeight ?? 80,
                    borderRadius: 16,
                    border: isDark
                      ? "1px dashed rgba(148, 163, 184, 0.2)"
                      : "1px dashed rgba(148, 163, 184, 0.45)",
                    background: sectionBg,
                    padding: "10px 10px 8px",
                    overflowY: "auto"
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 0.7,
                      textTransform: "uppercase",
                      color: mutedColor,
                      borderBottom: `1px solid ${isDark ? "#32455f" : "rgba(148,163,184,0.35)"}`,
                      paddingBottom: 5,
                      marginBottom: 8
                    }}
                  >
                    Libraries
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          padding: "12px 16px 14px",
          borderTop: `1px solid ${palette.border}33`,
          background: footerBg
        }}
      >
        <button
          type="button"
          className="nodrag nopan"
          onMouseDown={handleMouseDown}
          onClick={handleToggle}
          style={{
            width: "100%",
            borderRadius: 12,
            border: `1px solid ${buttonBorder}`,
            background: buttonBg,
            color: textColor,
            fontSize: 11,
            fontWeight: 700,
            padding: "9px 12px",
            cursor: "pointer",
            transition:
              "background-color 150ms ease, border-color 150ms ease, transform 150ms ease"
          }}
        >
          {expanded ? "Hide details" : "View details"}
        </button>
      </div>

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
