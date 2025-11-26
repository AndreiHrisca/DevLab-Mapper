// src/components/sidepanel/DetailsPanel.tsx
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

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  selectedNodeId,
  selectedEdgeId,
  nodes,
  edges,
  edgeAdjustments,
  theme
}) => {
  const node = nodes.find((n) => n.id === selectedNodeId) || null;
  const edge = edges.find((e) => e.id === selectedEdgeId) || null;
  const adjustment = edge ? edgeAdjustments[edge.id] : undefined;
  const effectiveBend =
    (adjustment?.bend ?? edge?.bend) ?? 0;
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
    bg: isDark ? "#0f172a" : "#ffffff",
    border: isDark ? "#1f2937" : "#e5e7eb",
    text: isDark ? "#e2e8f0" : "#111827",
    muted: isDark ? "#94a3b8" : "#6b7280",
    blockBg: isDark ? "#0b1220" : "#f9fafb",
    blockBorder: isDark ? "#1f2937" : "#e5e7eb"
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: colors.bg,
        borderLeft: `1px solid ${colors.border}`,
        color: colors.text
      }}
    >
      {/* Header fijo */}
      <div
        style={{
          padding: "16px 18px",
          borderBottom: `1px solid ${colors.border}`,
          background: isDark ? "#0b1220" : "#ffffff",
          position: "sticky",
          top: 0,
          zIndex: 5
        }}
      >
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            margin: 0
          }}
        >
          Details
        </h2>
      </div>

      {/* Contenido scrollable */}
      <div
        style={{
          padding: "18px",
          overflowY: "auto",
          flex: 1,
          color: colors.text
        }}
      >
        {!node && !edge && (
          <p style={{ fontSize: "0.85rem", color: colors.muted }}>
            Select a node or edge in the diagram to see details.
          </p>
        )}

        {node && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600 }}>Node</h3>
            <p style={{ fontSize: "0.8rem", marginTop: 4 }}>
              <strong>ID:</strong> {node.id}
              <br />
              <strong>Kind:</strong> {node.kind}
            </p>
            <pre
              style={{
                background: colors.blockBg,
                borderRadius: 8,
                padding: 12,
                fontSize: "0.75rem",
                overflow: "auto",
                border: `1px solid ${colors.blockBorder}`,
                color: colors.text
              }}
            >
              {JSON.stringify(node.data, null, 2)}
            </pre>
          </div>
        )}

        {edge && (
          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600 }}>Edge</h3>
            <p style={{ fontSize: "0.8rem", marginTop: 4 }}>
              <strong>ID:</strong> {edge.id}
              <br />
              <strong>Kind:</strong> {edge.kind}
              <br />
              <strong>Color:</strong> {edge.color ?? "default"}
              <br />
              <strong>Bend:</strong> {effectiveBend}
              <br />
              <strong>Curve offset:</strong>{" "}
              {effectiveCurveOffset.x !== 0 || effectiveCurveOffset.y !== 0
                ? `x=${effectiveCurveOffset.x}, y=${effectiveCurveOffset.y}`
                : "none"}
              <br />
              <strong>Label offset:</strong>{" "}
              {effectiveOffset.x !== 0 || effectiveOffset.y !== 0
                ? `x=${effectiveOffset.x}, y=${effectiveOffset.y}`
                : "none"}
            </p>
            <pre
              style={{
                background: colors.blockBg,
                borderRadius: 8,
                padding: 12,
                fontSize: "0.75rem",
                overflow: "auto",
                border: `1px solid ${colors.blockBorder}`,
                color: colors.text
              }}
            >
              {JSON.stringify(edge.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
