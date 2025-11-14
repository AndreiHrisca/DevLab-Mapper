// src/App.tsx
import React, { useState } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { JsonEditor } from "./components/editor/JsonEditor";
import { DiagramCanvas } from "./components/diagram/DiagramCanvas";
import { DetailsPanel } from "./components/sidepanel/DetailsPanel";

import { parseLabJson } from "./core/parser";
import { GraphNode, GraphEdge } from "./core/types";

export const App: React.FC = () => {
  const [jsonText, setJsonText] = useState<string>("");
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // paneles UI
  const [showEditor, setShowEditor] = useState(true);
  const [showSidepanel, setShowSidepanel] = useState(true);

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    try {
      const parsed = JSON.parse(value);
      const { nodes, edges } = parseLabJson(parsed);
      setGraphNodes(nodes);
      setGraphEdges(edges);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    } catch {
      // si hay error de JSON, simplemente mostramos el error en consola
      // pero no rompemos el diagrama actual
      // console.error(err);
    }
  };

  return (
    <AppLayout
      editor={
        <JsonEditor
          value={jsonText}
          onChange={handleJsonChange}
        />
      }
      diagram={
        <DiagramCanvas
          nodes={graphNodes}
          edges={graphEdges}
          onNodeSelect={setSelectedNodeId}
          onEdgeSelect={setSelectedEdgeId}
        />
      }
      sidepanel={
        <DetailsPanel
          nodes={graphNodes}
          edges={graphEdges}
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
