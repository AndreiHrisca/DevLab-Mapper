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
  NodeAdjustment,
  LayoutState
} from "./core/types";

type EdgeShape = "curved" | "straight";

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}

type Theme = "light" | "dark";

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
  const [editEdgesMode, setEditEdgesMode] = useState<boolean>(false);
  const [edgeShape, setEdgeShape] = useState<EdgeShape>(() => {
    const stored =
      typeof localStorage !== "undefined"
        ? (localStorage.getItem("devlab-edge-shape") as EdgeShape | null)
        : null;
    return stored === "straight" ? "straight" : "curved";
  });
  const [uiFontSize, setUiFontSize] = useState<number>(() => {
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("devlab-font-size")
        : null;
    const n = stored ? Number(stored) : 12;
    return Number.isFinite(n) ? Math.min(Math.max(n, 10), 16) : 12;
  });
  const [monoEditor, setMonoEditor] = useState<boolean>(() => {
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("devlab-mono-editor")
        : null;
    return stored === "off" ? false : true;
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const stored =
      typeof localStorage !== "undefined"
        ? (localStorage.getItem("devlab-theme") as Theme | null)
        : null;
    return stored === "dark" ? "dark" : "light";
  });

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
      const layout: LayoutState | undefined = parsed.layout;
      setGraphNodes(nodes);
      setGraphEdges(edges);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setEdgeAdjustments({});
      setNodeAdjustments({});
      setNodePositions({});
      setLayoutKey(key);
      setParseError(null);
      if (layout?.edges) setEdgeAdjustments(layout.edges);
      if (layout?.nodes) {
        const positions: Record<string, { x: number; y: number }> = {};
        const sizes: NodeAdjustments = {};
        Object.entries(layout.nodes).forEach(([id, v]) => {
          if (v.x != null && v.y != null) positions[id] = { x: v.x, y: v.y };
          if (v.width != null || v.height != null) sizes[id] = {
            width: v.width,
            height: v.height
          };
        });
        setNodePositions(positions);
        setNodeAdjustments(sizes);
      }
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

  useEffect(() => {
    try {
      localStorage.setItem("devlab-theme", theme);
    } catch {
      // ignore
    }
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    syncLayoutIntoJson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edgeAdjustments, nodeAdjustments, nodePositions]);

  const toggleTheme = () =>
    setTheme((t) => (t === "light" ? "dark" : "light"));

  const toggleEditEdgesMode = () => setEditEdgesMode((v) => !v);
  const toggleEdgeShape = () =>
    setEdgeShape((s) => {
      const next: EdgeShape = s === "curved" ? "straight" : "curved";
      try {
        localStorage.setItem("devlab-edge-shape", next);
      } catch {
        // ignore
      }
      return next;
    });

  const handleResetEdges = () => setEdgeAdjustments({});
  const handleResetLayout = () => {
    setNodeAdjustments({});
    setNodePositions({});
  };

  const handleFontSize = (delta: number) => {
    setUiFontSize((s) => {
      const next = Math.min(Math.max(s + delta, 10), 16);
      try {
        localStorage.setItem("devlab-font-size", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleMonoEditor = () => {
    setMonoEditor((v) => {
      const next = !v;
      try {
        localStorage.setItem("devlab-mono-editor", next ? "on" : "off");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const syncLayoutIntoJson = useCallback(() => {
    if (parseError || !jsonText.trim()) return;
    try {
      const parsed = JSON.parse(jsonText);
      const layout: LayoutState = {
        nodes: {},
        edges: edgeAdjustments
      };
      Object.entries(nodePositions).forEach(([id, pos]) => {
        layout.nodes![id] = {
          ...(layout.nodes![id] ?? {}),
          x: pos.x,
          y: pos.y
        };
      });
      Object.entries(nodeAdjustments).forEach(([id, size]) => {
        layout.nodes![id] = {
          ...(layout.nodes![id] ?? {}),
          width: size.width,
          height: size.height
        };
      });
      parsed.layout = layout;
      const pretty = JSON.stringify(parsed, null, 2);
      if (pretty !== jsonText) {
        setJsonText(pretty);
        const key = hashText(pretty);
        setLayoutKey(key);
        try {
          localStorage.setItem(`devlab-layout-${key}`, JSON.stringify({
            edges: edgeAdjustments,
            nodes: nodeAdjustments,
            positions: nodePositions
          }));
        } catch {
          // ignore
        }
      }
    } catch {
      // si el JSON es inválido, no intentamos sincronizar
    }
  }, [parseError, jsonText, edgeAdjustments, nodeAdjustments, nodePositions]);

  return (
    <AppLayout
      theme={theme}
      editEdgesMode={editEdgesMode}
      edgeShape={edgeShape}
      uiFontSize={uiFontSize}
      editor={
        <JsonEditor
          value={jsonText}
          errorMessage={parseError ?? undefined}
          fontSize={uiFontSize}
          mono={monoEditor}
          onToggleMono={toggleMonoEditor}
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
          editEdgesMode={editEdgesMode}
          edgeShape={edgeShape}
          theme={theme}
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
          theme={theme}
        />
      }
      showEditor={showEditor}
      showSidepanel={showSidepanel}
      onToggleEditor={() => setShowEditor((v) => !v)}
      onToggleSidepanel={() => setShowSidepanel((v) => !v)}
      onToggleTheme={toggleTheme}
      onToggleEditEdges={toggleEditEdgesMode}
      onToggleEdgeShape={toggleEdgeShape}
      onResetEdges={handleResetEdges}
      onResetLayout={handleResetLayout}
      onFontSizeChange={handleFontSize}
    />
  );
};

export default App;
