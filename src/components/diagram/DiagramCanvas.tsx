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
  NodeChange,
  MarkerType
} from "reactflow";
import "reactflow/dist/style.css";

import {
  GraphNode,
  GraphEdge,
  EdgeAdjustments,
  EdgeAdjustment
} from "../../core/types";
import { MachineNode } from "./nodeTypes/MachineNode";
import { ServiceNode } from "./nodeTypes/ServiceNode";
import { LibraryNode } from "./nodeTypes/LibraryNode";
import { AdjustableEdge } from "./edgeTypes/AdjustableEdge";

import dagre from "dagre";

type DiagramCanvasProps = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  edgeAdjustments: EdgeAdjustments;
  nodeAdjustments: Record<string, { width?: number; height?: number }>;
  nodePositions: Record<string, { x: number; y: number }>;
  onNodeAdjust: (nodeId: string, adjustment: { width?: number; height?: number }) => void;
  onEdgeAdjust: (edgeId: string, adjustment: EdgeAdjustment) => void;
  onNodesMove: (positions: Record<string, { x: number; y: number }>) => void;
  onNodeSelect: (id: string | null) => void;
  onEdgeSelect: (id: string | null) => void;
};

const nodeTypes = {
  machine: MachineNode,
  service: ServiceNode,
  library: LibraryNode
};

const edgeTypes = {
  adjustable: AdjustableEdge
};

// -----------------------------------------------------------------------------
// Layout constants

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const MACHINE_WIDTH = 420;

// Estas alturas deben aproximarse a lo que dibuja MachineNode en el header
const HEADER_HEIGHT = 40;
const META_HEIGHT = 90;

// padding vertical del cuerpo respecto al borde de la máquina
const BODY_VERTICAL_PADDING = 10;

// offset extra para bajar todo el bloque Services/Libs
const BODY_EXTRA_OFFSET = 12;

// Alturas “útiles” para cada nodo interno
const SERVICE_HEIGHT = 80;
const LIB_HEIGHT = 70;
const GAP = 6;

// espacio dentro del frame (parte superior/inferior)
const SERVICES_BOX_PADDING_TOP = 18;
const SERVICES_BOX_PADDING_BOTTOM = 10;
const LIBS_BOX_PADDING_TOP = 18;
const LIBS_BOX_PADDING_BOTTOM = 10;

// desplazamiento del contenido respecto al título "SERVICES"/"LIBRARIES"
const LABEL_OFFSET = 28;

// layout horizontal
const COLUMN_GAP = 12;
const HORIZONTAL_PADDING = 16;

// margen horizontal interno extra para que las tarjetas no “rocen” el borde
const NODE_INNER_MARGIN_X = 22;

// -----------------------------------------------------------------------------
// Dagre sólo para las máquinas

function layoutMachines(
  machines: RFNode[],
  logicalEdges: RFEdge[]
): RFNode[] {
  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 120,
    ranksep: 190
  });

  machines.forEach((m) => {
    const width = (m.style as any)?.width ?? MACHINE_WIDTH;
    const height = (m.style as any)?.height ?? 260;
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
        y: pos.y - ((m.style as any)?.height ?? 260) / 2
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left
    };
  });
}

// -----------------------------------------------------------------------------

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  nodes,
  edges,
  edgeAdjustments,
  nodeAdjustments,
  onNodeAdjust,
  nodePositions,
  onNodesMove,
  onEdgeAdjust,
  onNodeSelect,
  onEdgeSelect
}) => {
  const layoutNodes = useMemo(() => {
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

    // ----------------- 1) Máquinas como contenedores ------------------------
    const machineNodes: RFNode[] = machines.map((m) => {
      const svc = servicesByMachine.get(m.id) ?? [];
      const libs = libsByMachine.get(m.id) ?? [];

      const manualSize = nodeAdjustments[m.id] ?? {};

      const svcCount = svc.length;
      const libCount = libs.length;

      const servicesUsefulHeight =
        svcCount > 0
          ? svcCount * SERVICE_HEIGHT + Math.max(svcCount - 1, 0) * GAP
          : 0;

      const libsUsefulHeight =
        libCount > 0
          ? libCount * LIB_HEIGHT + Math.max(libCount - 1, 0) * GAP
          : 0;

      const servicesBoxHeight =
        svcCount > 0
          ? SERVICES_BOX_PADDING_TOP +
            LABEL_OFFSET +
            servicesUsefulHeight +
            SERVICES_BOX_PADDING_BOTTOM
          : 0;

      const libsBoxHeight =
        libCount > 0
          ? LIBS_BOX_PADDING_TOP +
            LABEL_OFFSET +
            libsUsefulHeight +
            LIBS_BOX_PADDING_BOTTOM
          : 0;

      const bodyHeight = Math.max(servicesBoxHeight, libsBoxHeight);

      const contentHeight =
        HEADER_HEIGHT +
        META_HEIGHT +
        BODY_VERTICAL_PADDING +
        BODY_EXTRA_OFFSET +
        bodyHeight +
        BODY_VERTICAL_PADDING;

      const width =
        manualSize.width != null
          ? Math.max(manualSize.width, 360)
          : MACHINE_WIDTH;

      const height = Math.max(
        contentHeight,
        manualSize.height ?? 0,
        260
      );

      const machineData = m.data as any;

      return {
        id: m.id,
        type: "machine",
        data: {
          label: m.label,
          os: machineData?.os,
          ip: machineData?.ip,
          permissions: machineData?.permissions,
          status: machineData?.status,
          cpuCores: machineData?.capacity?.cpuCores,
          ramGB: machineData?.capacity?.ramGB,
          datacenter: machineData?.location?.datacenter,
          rack: machineData?.location?.rack,
          zone: machineData?.location?.zone,
          tags: machineData?.tags,
          hasServices: svcCount > 0,
          hasLibraries: libCount > 0,
          servicesAreaHeight: servicesBoxHeight,
          librariesAreaHeight: libsBoxHeight,
          onResize: (size: { width: number; height: number }) =>
            onNodeAdjust(m.id, size)
        },
        draggable: true,
        position: { x: 0, y: 0 },
        style: {
          width,
          height
        }
      };
    });

    // 2) Edges lógicos máquina→máquina para Dagre
    const layoutEdgesForMachines: RFEdge[] = edges
      .map((e) => {
        const fromNode = nodes.find((n) => n.id === e.from);
        const toNode = nodes.find((n) => n.id === e.to);
        if (!fromNode || !toNode) return null;

        const fromHost =
          fromNode.kind === "machine" ? fromNode.id : fromNode.host;
        const toHost =
          toNode.kind === "machine" ? toNode.id : toNode.host;

        if (!fromHost || !toHost || fromHost === toHost) return null;

        return {
          id: `layout-${e.id}`,
          source: fromHost,
          target: toHost
        } as RFEdge;
      })
      .filter((e): e is RFEdge => e !== null);

    const layoutedMachines = layoutMachines(
      machineNodes,
      layoutEdgesForMachines
    );

    const buildChildren = (machineNode: RFNode): RFNode[] => {
      const machineId = machineNode.id;
      const svc = servicesByMachine.get(machineId) ?? [];
      const libs = libsByMachine.get(machineId) ?? [];

      const svcCount = svc.length;
      const libCount = libs.length;

      const servicesUsefulHeight =
        svcCount > 0
          ? svcCount * SERVICE_HEIGHT + Math.max(svcCount - 1, 0) * GAP
          : 0;

      const libsUsefulHeight =
        libCount > 0
          ? libCount * LIB_HEIGHT + Math.max(libCount - 1, 0) * GAP
          : 0;

      const servicesBoxHeight =
        svcCount > 0
          ? SERVICES_BOX_PADDING_TOP +
            LABEL_OFFSET +
            servicesUsefulHeight +
            SERVICES_BOX_PADDING_BOTTOM
          : 0;

      const libsBoxHeight =
        libCount > 0
          ? LIBS_BOX_PADDING_TOP +
            LABEL_OFFSET +
            libsUsefulHeight +
            LIBS_BOX_PADDING_BOTTOM
          : 0;

      const bodyHeight = Math.max(servicesBoxHeight, libsBoxHeight);

      const bodyTop =
        HEADER_HEIGHT + META_HEIGHT + BODY_VERTICAL_PADDING + BODY_EXTRA_OFFSET;

      const machineWidth =
        (machineNode.style as any)?.width ?? MACHINE_WIDTH;
      const innerWidth = machineWidth - HORIZONTAL_PADDING * 2;
      const colWidth = (innerWidth - COLUMN_GAP) / 2;

      const servicesFrameX = HORIZONTAL_PADDING;
      const libsFrameX = HORIZONTAL_PADDING + colWidth + COLUMN_GAP;

      const serviceNodeX = servicesFrameX + NODE_INNER_MARGIN_X;
      const serviceNodeWidth = colWidth - NODE_INNER_MARGIN_X * 2;

      const libsNodeX = libsFrameX + NODE_INNER_MARGIN_X;
      const libsNodeWidth = colWidth - NODE_INNER_MARGIN_X * 2;

      const children: RFNode[] = [];

      let currentServiceY =
        bodyTop + SERVICES_BOX_PADDING_TOP + LABEL_OFFSET;
      svc.forEach((s) => {
        children.push({
          id: s.id,
          type: "service",
          parentId: machineId,
          extent: "parent",
          draggable: false,
          position: {
            x: serviceNodeX,
            y: currentServiceY
          },
          style: {
            width: serviceNodeWidth
          },
          data: {
            label: s.label,
            type: s.data?.type,
            ports: s.data?.ports
          }
        });

        currentServiceY += SERVICE_HEIGHT + GAP;
      });

      let currentLibY = bodyTop + LIBS_BOX_PADDING_TOP + LABEL_OFFSET;
      libs.forEach((l) => {
        children.push({
          id: l.id,
          type: "library",
          parentId: machineId,
          extent: "parent",
          draggable: false,
          position: {
            x: libsNodeX,
            y: currentLibY
          },
          style: {
            width: libsNodeWidth
          },
          data: {
            label: l.label,
            version: l.data?.version,
            path: l.data?.path
          }
        });

        currentLibY += LIB_HEIGHT + GAP;
      });

      const _bodyBottom = bodyTop + bodyHeight;
      void _bodyBottom;

      return children;
    };

    const childNodes = layoutedMachines.flatMap((m) => buildChildren(m));

    const positionedMachines = layoutedMachines.map((m) => {
      const saved = nodePositions[m.id];
      return saved
        ? { ...m, position: saved }
        : m;
    });

    return [...positionedMachines, ...childNodes];
  }, [nodes, edges, nodeAdjustments, nodePositions]);

  const layoutEdges = useMemo(() => {
    const rfEdges: RFEdge[] = edges.map((e) => {
      const sourceNode = nodes.find((n) => n.id === e.from);
      const targetNode = nodes.find((n) => n.id === e.to);
      const raiseOverMachines =
        (sourceNode && sourceNode.kind !== "machine") ||
        (targetNode && targetNode.kind !== "machine");

      const adjustments = edgeAdjustments[e.id] ?? {};
      const color = e.color ?? "#0f172a";
      const baseStyle =
        e.kind === "depends_on"
          ? { strokeDasharray: "4 2", strokeWidth: 1.2 }
          : { strokeWidth: 1.6 };

      const colorStyle = { stroke: color };

      const bend =
        adjustments.bend ??
        e.bend ??
        0;

      const labelOffset = {
        x: adjustments.labelOffset?.x ?? e.labelOffset?.x ?? 0,
        y: adjustments.labelOffset?.y ?? e.labelOffset?.y ?? 0
      };

      const curveOffset = {
        x: adjustments.curveOffset?.x ?? e.curveOffset?.x ?? 0,
        y: adjustments.curveOffset?.y ?? e.curveOffset?.y ?? 0
      };

      return {
        id: e.id,
        source: e.from,
        target: e.to,
        animated: e.kind === "communicates_with",
        type: "adjustable",
        style: {
          ...baseStyle,
          ...colorStyle
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color
        },
        data: {
          label: e.label,
          bend,
          labelOffset,
          color,
          curveOffset,
          raiseOverMachines,
          onCurveOffsetChange: (offset: { x: number; y: number }) =>
            onEdgeAdjust(e.id, { curveOffset: offset })
        }
      };
    });

    return rfEdges;
  }, [edges, edgeAdjustments, onEdgeAdjust, nodes]);

  // ----------------- estado para drag de máquinas ---------------------------
  const [flowNodes, setFlowNodes] = useState<RFNode[]>([]);
  const [flowEdges, setFlowEdges] = useState<RFEdge[]>([]);

  useEffect(() => {
    setFlowNodes(layoutNodes);
  }, [layoutNodes]);

  useEffect(() => {
    setFlowEdges(layoutEdges);
  }, [layoutEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setFlowNodes((nds) => {
        let changedPosition = false;
        const updated = applyNodeChanges(changes, nds);
        const positions: Record<string, { x: number; y: number }> = {};

        changes.forEach((c) => {
          if (c.type === "position" && c.position && c.id) {
            const node = updated.find((n) => n.id === c.id);
            if (node && node.type === "machine" && !node.parentNode) {
              positions[c.id] = {
                x: node.position.x,
                y: node.position.y
              };
              changedPosition = true;
            }
          }
        });

        if (changedPosition) {
          onNodesMove(positions);
        }

        return updated;
      });
    },
    [onNodesMove]
  );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
