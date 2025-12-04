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
import ELK from "elkjs/lib/elk.bundled.js";

type DiagramCanvasProps = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  edgeAdjustments: EdgeAdjustments;
  editEdgesMode: boolean;
  layoutMode: "manual" | "auto";
  nodeAdjustments: Record<string, { width?: number; height?: number }>;
  nodePositions: Record<string, { x: number; y: number }>;
  theme: "light" | "dark";
  onNodeAdjust: (nodeId: string, adjustment: { width?: number; height?: number }) => void;
  onEdgeAdjust: (edgeId: string, adjustment: EdgeAdjustment) => void;
  onNodesMove: (positions: Record<string, { x: number; y: number }>) => void;
  onNodeSelect: (id: string | null) => void;
  onEdgeSelect: (id: string | null) => void;
  edgeShape: "curved" | "straight";
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

function getMachineSize(node: RFNode) {
  const width =
    (node.style as any)?.width != null
      ? Number((node.style as any)?.width)
      : MACHINE_WIDTH;
  const height =
    (node.style as any)?.height != null
      ? Number((node.style as any)?.height)
      : 260;
  return { width, height };
}

export function resolveMachineOverlaps(
  updated: RFNode[],
  previous: RFNode[]
): RFNode[] {
  const machines = updated.filter(
    (n) => n.type === "machine" && !n.parentNode
  );

  return updated.map((node) => {
    if (node.type !== "machine" || node.parentNode) return node;

    const size = getMachineSize(node);
    const overlaps = machines.some((other) => {
      if (other.id === node.id) return false;
      const otherSize = getMachineSize(other);
      const ax1 = node.position.x;
      const ay1 = node.position.y;
      const ax2 = ax1 + size.width;
      const ay2 = ay1 + size.height;

      const bx1 = other.position.x;
      const by1 = other.position.y;
      const bx2 = bx1 + otherSize.width;
      const by2 = by1 + otherSize.height;

      return !(ax2 <= bx1 || bx2 <= ax1 || ay2 <= by1 || by2 <= ay1);
    });

    if (!overlaps) return node;

    const prev = previous.find((n) => n.id === node.id);
    return prev ? { ...node, position: prev.position } : node;
  });
}

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
  editEdgesMode,
  layoutMode,
  edgeShape,
  theme,
  onEdgeAdjust,
  onNodeSelect,
  onEdgeSelect
}) => {
  const isDark = theme === "dark";
  const elk = useMemo(() => new ELK(), []);
  const [autoPositions, setAutoPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

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
          theme,
          onResize: (size: { width: number; height: number }) =>
            onNodeAdjust(m.id, size)
        },
        draggable: layoutMode === "manual",
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
            theme,
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
            theme,
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
      if (layoutMode === "auto") {
        const auto = autoPositions[m.id];
        if (auto) {
          return {
            ...m,
            draggable: false,
            position: { x: auto.x, y: auto.y }
          };
        }
        return { ...m, draggable: false };
      }
      const saved = nodePositions[m.id];
      return saved ? { ...m, position: saved } : m;
    });

    return [...positionedMachines, ...childNodes];
  }, [autoPositions, layoutMode, nodes, edges, nodeAdjustments, nodePositions]);

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

      const isStraight = edgeShape === "straight";
      const bend =
        (isStraight ? 0 : adjustments.bend) ??
        e.bend ??
        0;

      const labelOffset = {
        x: adjustments.labelOffset?.x ?? e.labelOffset?.x ?? 0,
        y: adjustments.labelOffset?.y ?? e.labelOffset?.y ?? 0
      };

      const curveOffset = {
        x: isStraight
          ? 0
          : adjustments.curveOffset?.x ?? e.curveOffset?.x ?? 0,
        y: isStraight
          ? 0
          : adjustments.curveOffset?.y ?? e.curveOffset?.y ?? 0
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
          useStraight: isStraight,
          onCurveOffsetChange: editEdgesMode && !isStraight
            ? (offset: { x: number; y: number }) =>
                onEdgeAdjust(e.id, { curveOffset: offset })
            : undefined
        }
      };
    });

    return rfEdges;
  }, [edgeShape, editEdgesMode, edges, edgeAdjustments, onEdgeAdjust, nodes]);

  useEffect(() => {
    if (layoutMode !== "auto") {
      setAutoPositions({});
      return;
    }
    const machines = nodes.filter((n) => n.kind === "machine");
    if (machines.length === 0) {
      setAutoPositions({});
      return;
    }
    const edgesBetweenMachines = edges
      .map((e) => {
        const fromNode = nodes.find((n) => n.id === e.from);
        const toNode = nodes.find((n) => n.id === e.to);
        const fromHost =
          fromNode?.kind === "machine" ? fromNode.id : fromNode?.host;
        const toHost =
          toNode?.kind === "machine" ? toNode.id : toNode?.host;
        if (!fromHost || !toHost || fromHost === toHost) return null;
        return { id: e.id, sources: [fromHost], targets: [toHost] };
      })
      .filter((e): e is { id: string; sources: string[]; targets: string[] } => e !== null);

    const graph = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.spacing.nodeNode": "120",
        "elk.layered.spacing.nodeNodeBetweenLayers": "160",
        "elk.direction": "DOWN"
      },
      children: machines.map((m) => {
        const manualSize = nodeAdjustments[m.id] ?? {};
        const width =
          manualSize.width != null
            ? Math.max(manualSize.width, 360)
            : MACHINE_WIDTH;
        const height = Math.max(manualSize.height ?? 0, 260);
        return {
          id: m.id,
          width,
          height
        };
      }),
      edges: edgesBetweenMachines
    };

    elk
      .layout(graph)
      .then((res) => {
        const positions: Record<string, { x: number; y: number }> = {};
        res.children?.forEach((c) => {
          if (c.id && c.x != null && c.y != null) {
            positions[c.id] = { x: c.x, y: c.y };
          }
        });
        setAutoPositions(positions);
      })
      .catch(() => {
        // ignore layout errors
      });
  }, [edgeAdjustments, edges, elk, layoutMode, nodeAdjustments, nodes]);

  // ----------------- estado para drag de máquinas ---------------------------
  const [flowNodes, setFlowNodes] = useState<RFNode[]>([]);
  const [flowEdges, setFlowEdges] = useState<RFEdge[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isDragging) return;
    setFlowNodes(layoutNodes);
  }, [isDragging, layoutNodes]);

  useEffect(() => {
    setFlowEdges(layoutEdges);
  }, [layoutEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (layoutMode === "auto") return;
      setFlowNodes((nds) => {
        let changedPosition = false;
        const updated = applyNodeChanges(changes, nds);
        const resolved = resolveMachineOverlaps(updated, nds);

        const positions: Record<string, { x: number; y: number }> = {};

        changes.forEach((c) => {
          if (c.type === "position" && c.position && c.id) {
            const node = resolved.find((n) => n.id === c.id);
            const prev = nds.find((n) => n.id === c.id);
            if (
              node &&
              node.type === "machine" &&
              !node.parentNode &&
              (!prev ||
                prev.position.x !== node.position.x ||
                prev.position.y !== node.position.y)
            ) {
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

        return resolved;
      });
    },
    [layoutMode, onNodesMove]
  );

  const handleNodeDragStart = useCallback(() => {
    if (layoutMode === "manual") setIsDragging(true);
  }, [layoutMode]);

  const handleNodeDragStop = useCallback(() => {
    if (layoutMode === "manual") setIsDragging(false);
  }, [layoutMode]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.05}
        onNodesChange={onNodesChange}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={(_, node) => {
          onNodeSelect(node.id);
          onEdgeSelect(null);
        }}
        onPaneClick={() => {
          onNodeSelect(null);
          onEdgeSelect(null);
        }}
        onEdgeClick={(_, edge) => {
          onEdgeSelect(edge.id);
          onNodeSelect(null);
        }}
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
            border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
            boxShadow: "0 4px 10px rgba(15,23,42,0.18)",
            background: isDark ? "#0b1220" : "#ffffff"
          }}
          maskColor={isDark ? "rgba(15,23,42,0.75)" : "rgba(255,255,255,0.6)"}
          nodeColor={isDark ? "#1f2937" : "#e2e8f0"}
        />
        <Controls />
      </ReactFlow>
    </div>
  );
};
