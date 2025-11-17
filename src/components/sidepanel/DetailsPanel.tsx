// src/components/sidepanel/DetailsPanel.tsx
import React from "react";
import { GraphNode, GraphEdge } from "../../core/types";

type DetailsPanelProps = {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  selectedNodeId,
  selectedEdgeId,
  nodes,
  edges
}) => {
  const node = nodes.find((n) => n.id === selectedNodeId) || null;
  const edge = edges.find((e) => e.id === selectedEdgeId) || null;

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        borderLeft: "1px solid #e5e7eb"
      }}
    >
      {/* Header fijo */}
      <div
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid #e5e7eb",
          background: "white",
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
          flex: 1
        }}
      >
        {!node && !edge && (
          <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
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
                background: "#f9fafb",
                borderRadius: 8,
                padding: 12,
                fontSize: "0.75rem",
                overflow: "auto",
                border: "1px solid #e5e7eb"
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
            </p>
            <pre
              style={{
                background: "#f9fafb",
                borderRadius: 8,
                padding: 12,
                fontSize: "0.75rem",
                overflow: "auto",
                border: "1px solid #e5e7eb"
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