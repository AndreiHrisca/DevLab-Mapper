// src/App.tsx
import React, { useState } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { JsonEditor } from "./components/editor/JsonEditor";
import { DiagramCanvas } from "./components/diagram/DiagramCanvas";
import { DetailsPanel } from "./components/sidepanel/DetailsPanel";
import { parseLabJson } from "./core/parser";
import { GraphNode, GraphEdge } from "./core/types";

export const App: React.FC = () => {
  const [jsonText, setJsonText] = useState<string>(""); // el editor ya pone el ejemplo
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // UI: mostrar/ocultar paneles
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
      // si hay error de parseo, simplemente no actualizamos el grafo
    }
  };

  return (
    <AppLayout
      editor={
        <JsonEditor
          value={jsonText}
          onChange={handleJsonChange}
          onUseExample={() => {
            // si ya tenías lógica para cargar el ejemplo, reutilízala aquí
          }}
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
