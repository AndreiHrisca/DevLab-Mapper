import React from "react";
import { GraphNode, GraphEdge, EdgeAdjustments } from "../../core/types";

type DetailsPanelProps = {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  edgeAdjustments: EdgeAdjustments;
  theme: "light" | "dark";
};

function formatValue(value: unknown): string {
  if (value == null) return "No data";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((item) => formatValue(item)).join(", ") : "[]";
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 3);
    return entries.length > 0
      ? entries.map(([key, item]) => `${key}: ${formatValue(item)}`).join(" | ")
      : "{}";
  }
  return String(value);
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  selectedNodeId,
  selectedEdgeId,
  nodes,
  edges,
  edgeAdjustments,
  theme
}) => {
  const node = nodes.find((item) => item.id === selectedNodeId) ?? null;
  const edge = edges.find((item) => item.id === selectedEdgeId) ?? null;
  const edgeSource = edge ? nodes.find((item) => item.id === edge.from) : null;
  const edgeTarget = edge ? nodes.find((item) => item.id === edge.to) : null;
  const adjustment = edge ? edgeAdjustments[edge.id] : undefined;
  const effectiveBend = (adjustment?.bend ?? edge?.bend) ?? 0;
  const effectiveOffset = {
    x: adjustment?.labelOffset?.x ?? edge?.labelOffset?.x ?? 0,
    y: adjustment?.labelOffset?.y ?? edge?.labelOffset?.y ?? 0
  };
  const effectiveCurveOffset = {
    x: adjustment?.curveOffset?.x ?? edge?.curveOffset?.x ?? 0,
    y: adjustment?.curveOffset?.y ?? edge?.curveOffset?.y ?? 0
  };

  const isDark = theme === "dark";
  const colors = {
    bg: "var(--surface-1)",
    panel: "var(--surface-2)",
    panelAlt: "var(--surface-3)",
    border: "var(--border-color)",
    borderStrong: "var(--border-strong)",
    text: "var(--text-primary)",
    secondary: "var(--text-secondary)",
    muted: "var(--text-muted)",
    accent: "var(--accent)",
    accentSoft: "var(--accent-soft)",
    info: "var(--info)",
    infoSoft: "var(--info-soft)"
  };

  const cardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    background: colors.panel,
    boxShadow: "var(--shadow-soft)"
  };

  const renderRows = (rows: Array<{ label: string; value: string }>) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "88px 1fr",
        gap: "8px 12px",
        fontSize: 12,
        color: colors.secondary
      }}
    >
      {rows.map((row) => (
        <React.Fragment key={row.label}>
          <div style={{ fontWeight: 700, color: colors.text }}>{row.label}</div>
          <div>{row.value}</div>
        </React.Fragment>
      ))}
    </div>
  );

  const nodePreviewRows = node && typeof node.data === "object" && node.data
    ? Object.entries(node.data ?? {})
        .filter(([, value]) => value != null)
        .slice(0, 8)
        .map(([key, value]) => ({
          label: key,
          value: formatValue(value)
        }))
    : [];

  const edgePreviewRows =
    edge && typeof edge.data === "object" && edge.data
    ? Object.entries(edge.data)
        .filter(([, value]) => value != null)
        .slice(0, 6)
        .map(([key, value]) => ({
          label: key,
          value: formatValue(value)
        }))
    : [];

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: colors.bg,
        color: colors.text
      }}
    >
      <div
        style={{
          padding: "16px 18px",
          borderBottom: `1px solid ${colors.border}`,
          background: colors.panel,
          position: "sticky",
          top: 0,
          zIndex: 5
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700 }}>Details</div>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: colors.secondary
          }}
        >
          Select a node or edge to view a concise summary card.
        </div>
      </div>

      <div
        style={{
          padding: 16,
          overflowY: "auto",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 14
        }}
      >
        {!node && !edge && (
          <div
            style={{
              ...cardStyle,
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minHeight: 180,
              background: colors.panelAlt
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: `1px solid ${colors.borderStrong}`,
                background: colors.accentSoft,
                display: "grid",
                placeItems: "center",
                color: colors.accent,
                fontSize: 20,
                fontWeight: 700
              }}
            >
              i
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              No active selection
            </div>
            <div
              style={{
                fontSize: 12,
                color: colors.muted,
                maxWidth: 220
              }}
            >
              Click a VM, service, library, or connection to open its summary
              and full JSON block.
            </div>
          </div>
        )}

        {node && (
          <>
            <div
              style={{
                ...cardStyle,
                background: colors.panelAlt
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{node.label}</div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: colors.secondary
                    }}
                  >
                    Selected node
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span
                    style={{
                      padding: "5px 9px",
                      borderRadius: 999,
                      border: `1px solid ${colors.borderStrong}`,
                      background: colors.panel,
                      fontSize: 11,
                      fontWeight: 700,
                      color: colors.text
                    }}
                  >
                    {node.kind.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Summary</div>
              {renderRows([
                { label: "ID", value: node.id },
                { label: "Type", value: node.kind },
                { label: "Host", value: node.host ?? "Diagram root" },
                { label: "Source", value: node.jsonRefPath }
              ])}
            </div>

            {nodePreviewRows.length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Quick view</div>
                {renderRows(nodePreviewRows)}
              </div>
            )}

            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Full JSON</div>
              <details>
                <summary
                  style={{
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.secondary
                  }}
                >
                  View the full node structure
                </summary>
                <pre
                  style={{
                    margin: "10px 0 0",
                    background: isDark ? "#0b1220" : "#f8fafc",
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 11,
                    overflow: "auto",
                    border: `1px solid ${colors.border}`,
                    color: colors.text
                  }}
                >
                  {JSON.stringify(node.data, null, 2)}
                </pre>
              </details>
            </div>
          </>
        )}

        {edge && (
          <>
            <div
              style={{
                ...cardStyle,
                background: colors.panelAlt
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {edge.label ?? edge.id}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: colors.secondary
                    }}
                  >
                    Selected connection
                  </div>
                </div>
                <span
                  style={{
                    padding: "5px 9px",
                    borderRadius: 999,
                    border: `1px solid ${colors.borderStrong}`,
                    background: colors.panel,
                    fontSize: 11,
                    fontWeight: 700,
                    color: colors.text
                  }}
                >
                  {edge.kind}
                </span>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Summary</div>
              {renderRows([
                { label: "ID", value: edge.id },
                { label: "From", value: edgeSource?.label ?? edge.from },
                { label: "To", value: edgeTarget?.label ?? edge.to },
                { label: "Label", value: edge.label ?? "No label" },
                { label: "Color", value: edge.color ?? "Default color" }
              ])}
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Visual settings</div>
              {renderRows([
                { label: "Bend", value: String(effectiveBend) },
                {
                  label: "Curve offset",
                  value:
                    effectiveCurveOffset.x !== 0 || effectiveCurveOffset.y !== 0
                      ? `x=${effectiveCurveOffset.x}, y=${effectiveCurveOffset.y}`
                      : "No adjustment"
                },
                {
                  label: "Label offset",
                  value:
                    effectiveOffset.x !== 0 || effectiveOffset.y !== 0
                      ? `x=${effectiveOffset.x}, y=${effectiveOffset.y}`
                      : "No adjustment"
                }
              ])}
            </div>

            {edgePreviewRows.length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Metadata</div>
                {renderRows(edgePreviewRows)}
              </div>
            )}

            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Full JSON</div>
              <details>
                <summary
                  style={{
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.secondary
                  }}
                >
                  View the full connection structure
                </summary>
                <pre
                  style={{
                    margin: "10px 0 0",
                    background: isDark ? "#0b1220" : "#f8fafc",
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 11,
                    overflow: "auto",
                    border: `1px solid ${colors.border}`,
                    color: colors.text
                  }}
                >
                  {JSON.stringify(edge.data, null, 2)}
                </pre>
              </details>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
