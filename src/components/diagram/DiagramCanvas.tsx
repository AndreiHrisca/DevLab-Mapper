// src/components/diagram/DiagramCanvas.tsx
import React, { useMemo, useEffect, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node as RFNode,
  Edge as RFEdge,
  Position,
  applyNodeChanges,
  NodeChange          
} from "reactflow";
import "reactflow/dist/style.css";

import { GraphNode, GraphEdge } from "../../core/types";
import { MachineNode } from "./nodeTypes/MachineNode";
import { ServiceNode } from "./nodeTypes/ServiceNode";
import { LibraryNode } from "./nodeTypes/LibraryNode";

import dagre from "dagre";

type DiagramCanvasProps = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeSelect: (id: string | null) => void;
  onEdgeSelect: (id: string | null) => void;
};

const nodeTypes = {
  machine: MachineNode,
  service: ServiceNode,
  library: LibraryNode
};

// Config de Dagre sólo para las máquinas
const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const MACHINE_WIDTH = 280;

// Hemos aumentado todo esto para dar más aire
const SERVICE_HEIGHT = 70;
const LIB_HEIGHT = 30;
const HEADER_HEIGHT = 72;
const VERTICAL_PADDING = 24;
const GAP = 10;
const LIB_COL_WIDTH = 120;

function layoutMachines(
  machines: RFNode[],
  logicalEdges: RFEdge[]
): RFNode[] {
  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 80,
    ranksep: 160
  });

  machines.forEach((m) => {
    const width = (m.style as any)?.width ?? MACHINE_WIDTH;
    const height = (m.style as any)?.height ?? 200;
    dagreGraph.setNode(m.id, { width, height });
  });

  logicalEdges.forEach((e) => {
    dagreGraph.setEdge(e.source, e.target);
  });

  dagre.layout(dagreGraph);

  return machines.map((m) => {
    const pos = dagreGraph.node(m.id);
    return {
      ...m,
      position: {
        x: pos.x - ((m.style as any)?.width ?? MACHINE_WIDTH) / 2,
        y: pos.y - ((m.style as any)?.height ?? 200) / 2
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top
    };
  });
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  nodes,
  edges,
  onNodeSelect,
  onEdgeSelect
}) => {
  // 1) Calculamos layout base (Dagre) cuando cambian nodes/edges del parser
  const { layoutNodes, layoutEdges } = useMemo(() => {
    const machines = nodes.filter((n) => n.kind === "machine");
    const services = nodes.filter((n) => n.kind === "service");
    const libraries = nodes.filter((n) => n.kind === "library");

    const servicesByMachine = new Map<string, GraphNode[]>();
    const libsByMachine = new Map<string, GraphNode[]>();

    services.forEach((s) => {
      if (!s.host) return;
      if (!servicesByMachine.has(s.host)) servicesByMachine.set(s.host, []);
      servicesByMachine.get(s.host)!.push(s);
    });

    libraries.forEach((l) => {
      if (!l.host) return;
      if (!libsByMachine.has(l.host)) libsByMachine.set(l.host, []);
      libsByMachine.get(l.host)!.push(l);
    });

    // 1) Machines como contenedores
    const machineNodes: RFNode[] = machines.map((m) => {
      const svc = servicesByMachine.get(m.id) ?? [];
      const libs = libsByMachine.get(m.id) ?? [];

      const svcCount = svc.length;
      const libCount = libs.length;

      // libs en 2 columnas → nº filas
      const libRows = libCount === 0 ? 0 : Math.ceil(libCount / 2);

      const servicesHeight =
        svcCount > 0
          ? svcCount * SERVICE_HEIGHT + Math.max(svcCount - 1, 0) * GAP
          : 0;

      const libsHeight =
        libRows > 0 ? libRows * LIB_HEIGHT + Math.max(libRows - 1, 0) * GAP : 0;

      // Más espacio entre services y libs
      const separatorGap = svcCount > 0 && libCount > 0 ? 40 : 0;

      const contentHeight =
        HEADER_HEIGHT +
        VERTICAL_PADDING * 2 +
        servicesHeight +
        libsHeight +
        separatorGap;

      const height = Math.max(contentHeight, 200);

      return {
        id: m.id,
        type: "machine",
        data: {
          label: m.label,
          os: m.data?.os,
          ip: m.data?.ip,
          permissions: m.data?.permissions,
          status: m.data?.status,
          hasServices: svcCount > 0,
          hasLibraries: libCount > 0
        },
        draggable: true, // 👈 solo las máquinas
        position: { x: 0, y: 0 }, // lo rellena Dagre
        style: {
          width: MACHINE_WIDTH,
          height
        }
      };
    });

    // 2) Edges lógicos máquina→máquina para layout
    const layoutEdgesForMachines: RFEdge[] = edges
      .map((e) => {
        const fromNode = nodes.find((n) => n.id === e.from);
        const toNode = nodes.find((n) => n.id === e.to);
        if (!fromNode || !toNode) return null;

        const fromHost = fromNode.kind === "machine" ? fromNode.id : fromNode.host;
        const toHost = toNode.kind === "machine" ? toNode.id : toNode.host;
        if (!fromHost || !toHost || fromHost === toHost) return null;

        return {
          id: `layout-${e.id}`,
          source: fromHost,
          target: toHost
        } as RFEdge;
      })
      .filter((e): e is RFEdge => e !== null);

    // 3) Aplicamos Dagre a máquinas
    const layoutedMachines = layoutMachines(
      machineNodes,
      layoutEdgesForMachines
    );

    // 4) Hijos (services/libs) dentro de cada máquina
    const childNodes: RFNode[] = [];

    layoutedMachines.forEach((machineNode) => {
      const machineId = machineNode.id;
      const svc = servicesByMachine.get(machineId) ?? [];
      const libs = libsByMachine.get(machineId) ?? [];

      // Services empiezan bien por debajo del header
      let currentY = HEADER_HEIGHT + VERTICAL_PADDING;

      // Services en columna
      svc.forEach((s) => {
        childNodes.push({
          id: s.id,
          type: "service",
          parentId: machineId,
          extent: "parent",
          position: {
            x: 16,
            y: currentY
          },
          data: {
            label: s.label,
            type: s.data?.type
          }
        });

        currentY += SERVICE_HEIGHT + GAP;
      });

      // Más hueco antes de las libs
      if (svc.length > 0 && libs.length > 0) {
        currentY += 40;
      }

      // Libs en 2 columnas
      libs.forEach((l, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);

        childNodes.push({
          id: l.id,
          type: "library",
          parentId: machineId,
          extent: "parent",
          position: {
            x: 16 + col * LIB_COL_WIDTH,
            y: currentY + row * (LIB_HEIGHT + GAP)
          },
          data: {
            label: l.label
          }
        });
      });
    });

    // 5) Edges reales entre nodos (services/libs)
    const rfEdges: RFEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.from,
      target: e.to,
      label: e.label,
      animated: e.kind === "communicates_with",
      style:
        e.kind === "depends_on"
          ? { strokeDasharray: "4 2", strokeWidth: 1.2 }
          : { strokeWidth: 1.6 }
    }));

    const rfNodes = [...layoutedMachines, ...childNodes];

    return { layoutNodes: rfNodes, layoutEdges: rfEdges };
  }, [nodes, edges]);

  // 2) Estado controlado por ReactFlow (para permitir drag)
  const [flowNodes, setFlowNodes] = useState<RFNode[]>([]);
  const [flowEdges, setFlowEdges] = useState<RFEdge[]>([]);

  // Cuando cambie el layout (nuevo JSON), reseteamos posiciones
  useEffect(() => {
    setFlowNodes(layoutNodes);
    setFlowEdges(layoutEdges);
  }, [layoutNodes, layoutEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setFlowNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        onNodesChange={onNodesChange}
        onNodeClick={(_, node) => onNodeSelect(node.id)}
        onPaneClick={() => {
          onNodeSelect(null);
          onEdgeSelect(null);
        }}
        onEdgeClick={(_, edge) => onEdgeSelect(edge.id)}
      >
        <Background gap={16} size={1} />
        <MiniMap
          pannable
          zoomable
          style={{
            width: 140,
            height: 90,
            bottom: 16,
            right: 16,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 10px rgba(15,23,42,0.18)"
          }}
        />
        <Controls />
      </ReactFlow>
    </div>
  );
};
