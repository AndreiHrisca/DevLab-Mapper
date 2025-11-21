import React, { useState, useCallback, useEffect, useMemo } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { JsonEditor } from "./components/editor/JsonEditor";
import { DiagramCanvas } from "./components/diagram/DiagramCanvas";
import { DetailsPanel } from "./components/sidepanel/DetailsPanel";

import { parseLabJson } from "./core/parser";
import {
  GraphNode,
  GraphEdge,
  EdgeAdjustments,
  EdgeAdjustment,
  NodeAdjustments,
  NodeAdjustment
} from "./core/types";

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}

export const App: React.FC = () => {
  const [jsonText, setJsonText] = useState<string>("");
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [edgeAdjustments, setEdgeAdjustments] = useState<EdgeAdjustments>({});
  const [nodeAdjustments, setNodeAdjustments] = useState<NodeAdjustments>({});
  const [nodePositions, setNodePositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(true);
  const [showSidepanel, setShowSidepanel] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const [layoutKey, setLayoutKey] = useState<string | null>(null);

  const storageKey = useMemo(
    () => (layoutKey ? `devlab-layout-${layoutKey}` : null),
    [layoutKey]
  );

  const loadAdjustments = useCallback(
    (key: string) => {
      try {
        const raw = localStorage.getItem(`devlab-layout-${key}`);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        setEdgeAdjustments(parsed.edges ?? {});
        setNodeAdjustments(parsed.nodes ?? {});
        setNodePositions(parsed.positions ?? {});
      } catch {
        // cache corrupto, lo ignoramos
      }
    },
    []
  );

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    try {
      const parsed = JSON.parse(value);
      if (!parsed.nodes || !parsed.edges) {
        throw new Error("El JSON debe contener 'nodes' y 'edges'.");
      }
      const { nodes, edges } = parseLabJson(parsed);
      const key = hashText(value);
      setGraphNodes(nodes);
      setGraphEdges(edges);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setEdgeAdjustments({});
      setNodeAdjustments({});
      setNodePositions({});
      setLayoutKey(key);
      setParseError(null);
      loadAdjustments(key);
    } catch {
      setGraphNodes([]);
      setGraphEdges([]);
      setParseError("JSON inválido o schema incompleto.");
    }
  };

  const handleEdgeAdjust = useCallback(
    (edgeId: string, adjustment: EdgeAdjustment) => {
      setEdgeAdjustments((prev) => {
        const next = { ...prev };
        const existing = next[edgeId] ?? {};
        next[edgeId] = {
          ...existing,
          ...adjustment
        };
        return next;
      });
    },
    []
  );

  const handleNodeAdjust = useCallback(
    (nodeId: string, adjustment: NodeAdjustment) => {
      setNodeAdjustments((prev) => {
        const next = { ...prev };
        const existing = next[nodeId] ?? {};
        next[nodeId] = {
          ...existing,
          ...adjustment
        };
        return next;
      });
    },
    []
  );

  const handleNodesMove = useCallback(
    (positions: Record<string, { x: number; y: number }>) => {
      setNodePositions((prev) => ({ ...prev, ...positions }));
    },
    []
  );

  useEffect(() => {
    if (!storageKey) return;
    const payload = {
      edges: edgeAdjustments,
      nodes: nodeAdjustments,
      positions: nodePositions
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore quota errors
    }
  }, [edgeAdjustments, nodeAdjustments, nodePositions, storageKey]);

  return (
    <AppLayout
      editor={
        <JsonEditor
          value={jsonText}
          errorMessage={parseError ?? undefined}
          onChange={handleJsonChange}
        />
      }
      diagram={
        <DiagramCanvas
          nodes={graphNodes}
          edges={graphEdges}
          edgeAdjustments={edgeAdjustments}
          nodeAdjustments={nodeAdjustments}
          nodePositions={nodePositions}
          onNodeAdjust={handleNodeAdjust}
          onEdgeAdjust={handleEdgeAdjust}
          onNodesMove={handleNodesMove}
          onNodeSelect={setSelectedNodeId}
          onEdgeSelect={setSelectedEdgeId}
        />
      }
      sidepanel={
        <DetailsPanel
          nodes={graphNodes}
          edges={graphEdges}
          edgeAdjustments={edgeAdjustments}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
        />
      }
      showEditor={showEditor}
      showSidepanel={showSidepanel}
      onToggleEditor={() => setShowEditor((v) => !v)}
      onToggleSidepanel={() => setShowSidepanel((v) => !v)}
    />
  );
};

export default App;
