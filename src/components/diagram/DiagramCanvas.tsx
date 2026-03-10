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
  showEdges: boolean;
  layoutMode: "manual" | "auto";
  nodeAdjustments: Record<string, { width?: number; height?: number }>;
  nodePositions: Record<string, { x: number; y: number }>;
  machineDetailsExpanded: Record<string, boolean>;
  theme: "light" | "dark";
  onNodeAdjust: (
    nodeId: string,
    adjustment: { width?: number; height?: number }
  ) => void;
  onEdgeAdjust: (edgeId: string, adjustment: EdgeAdjustment) => void;
  onNodesMove: (positions: Record<string, { x: number; y: number }>) => void;
  onToggleMachineDetails: (nodeId: string) => void;
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

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const MACHINE_WIDTH = 420;
const MIN_MACHINE_WIDTH = 360;
const MIN_MACHINE_HEIGHT = 260;
const HEADER_HEIGHT = 48;
const META_HEIGHT = 100;
const FOOTER_HEIGHT = 56;
const COLLAPSED_HEIGHT = 112;
const BODY_VERTICAL_PADDING = 12;
const BODY_EXTRA_OFFSET = 12;
const SERVICE_HEIGHT = 80;
const LIB_HEIGHT = 70;
const GAP = 6;
const SERVICES_BOX_PADDING_TOP = 18;
const SERVICES_BOX_PADDING_BOTTOM = 10;
const LIBS_BOX_PADDING_TOP = 18;
const LIBS_BOX_PADDING_BOTTOM = 10;
const LABEL_OFFSET = 28;
const COLUMN_GAP = 12;
const HORIZONTAL_PADDING = 16;
const NODE_INNER_MARGIN_X = 22;

type MachineLayoutMetrics = {
  width: number;
  height: number;
  servicesBoxHeight: number;
  libsBoxHeight: number;
  bodyHeight: number;
  detailsExpanded: boolean;
};

function buildMachineLayoutMetrics({
  serviceCount,
  libraryCount,
  manualSize,
  detailsExpanded
}: {
  serviceCount: number;
  libraryCount: number;
  manualSize: { width?: number; height?: number };
  detailsExpanded: boolean;
}): MachineLayoutMetrics {
  const servicesUsefulHeight =
    serviceCount > 0
      ? serviceCount * SERVICE_HEIGHT + Math.max(serviceCount - 1, 0) * GAP
      : 0;

  const libsUsefulHeight =
    libraryCount > 0
      ? libraryCount * LIB_HEIGHT + Math.max(libraryCount - 1, 0) * GAP
      : 0;

  const servicesBoxHeight =
    serviceCount > 0
      ? SERVICES_BOX_PADDING_TOP +
        LABEL_OFFSET +
        servicesUsefulHeight +
        SERVICES_BOX_PADDING_BOTTOM
      : 0;

  const libsBoxHeight =
    libraryCount > 0
      ? LIBS_BOX_PADDING_TOP +
        LABEL_OFFSET +
        libsUsefulHeight +
        LIBS_BOX_PADDING_BOTTOM
      : 0;

  const bodyHeight = Math.max(servicesBoxHeight, libsBoxHeight);
  const width =
    manualSize.width != null
      ? Math.max(manualSize.width, MIN_MACHINE_WIDTH)
      : MACHINE_WIDTH;

  if (!detailsExpanded) {
    return {
      width,
      height: COLLAPSED_HEIGHT,
      servicesBoxHeight,
      libsBoxHeight,
      bodyHeight,
      detailsExpanded
    };
  }

  const contentHeight =
    HEADER_HEIGHT +
    META_HEIGHT +
    BODY_VERTICAL_PADDING +
    BODY_EXTRA_OFFSET +
    bodyHeight +
    BODY_VERTICAL_PADDING +
    FOOTER_HEIGHT;

  return {
    width,
    height: Math.max(contentHeight, manualSize.height ?? 0, MIN_MACHINE_HEIGHT),
    servicesBoxHeight,
    libsBoxHeight,
    bodyHeight,
    detailsExpanded
  };
}

function getMachineSize(node: RFNode) {
  const width =
    (node.style as any)?.width != null
      ? Number((node.style as any)?.width)
      : MACHINE_WIDTH;
  const height =
    (node.style as any)?.height != null
      ? Number((node.style as any)?.height)
      : MIN_MACHINE_HEIGHT;
  return { width, height };
}

export function resolveMachineOverlaps(
  updated: RFNode[],
  previous: RFNode[]
): RFNode[] {
  const machines = updated.filter((n) => n.type === "machine" && !n.parentNode);

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

function layoutMachines(machines: RFNode[], logicalEdges: RFEdge[]): RFNode[] {
  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 120,
    ranksep: 190
  });

  machines.forEach((machine) => {
    const width = (machine.style as any)?.width ?? MACHINE_WIDTH;
    const height = (machine.style as any)?.height ?? MIN_MACHINE_HEIGHT;
    dagreGraph.setNode(machine.id, { width, height });
  });

  logicalEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return machines.map((machine) => {
    const pos = dagreGraph.node(machine.id);
    return {
      ...machine,
      position: {
        x: pos.x - ((machine.style as any)?.width ?? MACHINE_WIDTH) / 2,
        y:
          pos.y -
          ((machine.style as any)?.height ?? MIN_MACHINE_HEIGHT) / 2
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left
    };
  });
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  nodes,
  edges,
  edgeAdjustments,
  nodeAdjustments,
  nodePositions,
  editEdgesMode,
  showEdges,
  layoutMode,
  machineDetailsExpanded,
  theme,
  edgeShape,
  onNodeAdjust,
  onEdgeAdjust,
  onNodesMove,
  onToggleMachineDetails,
  onNodeSelect,
  onEdgeSelect
}) => {
  const isDark = theme === "dark";
  const elk = useMemo(() => new ELK(), []);
  const [autoPositions, setAutoPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const hiddenNodeIds = useMemo(() => {
    const hidden = new Set<string>();

    nodes.forEach((node) => {
      if (
        (node.kind === "service" || node.kind === "library") &&
        node.host &&
        !machineDetailsExpanded[node.host]
      ) {
        hidden.add(node.id);
      }
    });

    return hidden;
  }, [machineDetailsExpanded, nodes]);

  const layoutNodes = useMemo(() => {
    const machines = nodes.filter((node) => node.kind === "machine");
    const services = nodes.filter((node) => node.kind === "service");
    const libraries = nodes.filter((node) => node.kind === "library");

    const servicesByMachine = new Map<string, GraphNode[]>();
    const libsByMachine = new Map<string, GraphNode[]>();

    services.forEach((service) => {
      if (!service.host) return;
      if (!servicesByMachine.has(service.host)) {
        servicesByMachine.set(service.host, []);
      }
      servicesByMachine.get(service.host)!.push(service);
    });

    libraries.forEach((library) => {
      if (!library.host) return;
      if (!libsByMachine.has(library.host)) {
        libsByMachine.set(library.host, []);
      }
      libsByMachine.get(library.host)!.push(library);
    });

    const machineMetrics = new Map<string, MachineLayoutMetrics>();

    const machineNodes: RFNode[] = machines.map((machine) => {
      const servicesForMachine = servicesByMachine.get(machine.id) ?? [];
      const libsForMachine = libsByMachine.get(machine.id) ?? [];
      const manualSize = nodeAdjustments[machine.id] ?? {};
      const detailsExpanded = Boolean(machineDetailsExpanded[machine.id]);
      const metrics = buildMachineLayoutMetrics({
        serviceCount: servicesForMachine.length,
        libraryCount: libsForMachine.length,
        manualSize,
        detailsExpanded
      });

      machineMetrics.set(machine.id, metrics);

      const machineData = machine.data as any;

      return {
        id: machine.id,
        type: "machine",
        data: {
          label: machine.label,
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
          hasServices: servicesForMachine.length > 0,
          hasLibraries: libsForMachine.length > 0,
          servicesAreaHeight: metrics.servicesBoxHeight,
          librariesAreaHeight: metrics.libsBoxHeight,
          detailsExpanded: metrics.detailsExpanded,
          theme,
          onResize: (size: { width: number; height: number }) =>
            onNodeAdjust(machine.id, size),
          onToggleDetails: () => onToggleMachineDetails(machine.id)
        },
        draggable: layoutMode === "manual",
        position: { x: 0, y: 0 },
        style: {
          width: metrics.width,
          height: metrics.height
        }
      };
    });

    const layoutEdgesForMachines: RFEdge[] = edges
      .map((edge) => {
        const fromNode = nodes.find((node) => node.id === edge.from);
        const toNode = nodes.find((node) => node.id === edge.to);
        if (!fromNode || !toNode) return null;

        const fromHost =
          fromNode.kind === "machine" ? fromNode.id : fromNode.host;
        const toHost = toNode.kind === "machine" ? toNode.id : toNode.host;

        if (!fromHost || !toHost || fromHost === toHost) return null;

        return {
          id: `layout-${edge.id}`,
          source: fromHost,
          target: toHost
        } as RFEdge;
      })
      .filter((edge): edge is RFEdge => edge !== null);

    const layoutedMachines = layoutMachines(machineNodes, layoutEdgesForMachines);

    const buildChildren = (machineNode: RFNode): RFNode[] => {
      const machineId = machineNode.id;
      const servicesForMachine = servicesByMachine.get(machineId) ?? [];
      const libsForMachine = libsByMachine.get(machineId) ?? [];
      const metrics = machineMetrics.get(machineId);
      const detailsExpanded = Boolean(metrics?.detailsExpanded);

      const bodyTop =
        HEADER_HEIGHT + META_HEIGHT + BODY_VERTICAL_PADDING + BODY_EXTRA_OFFSET;

      const machineWidth =
        metrics?.width ?? (machineNode.style as any)?.width ?? MACHINE_WIDTH;
      const innerWidth = machineWidth - HORIZONTAL_PADDING * 2;
      const colWidth = (innerWidth - COLUMN_GAP) / 2;

      const servicesFrameX = HORIZONTAL_PADDING;
      const libsFrameX = HORIZONTAL_PADDING + colWidth + COLUMN_GAP;
      const serviceNodeX = servicesFrameX + NODE_INNER_MARGIN_X;
      const serviceNodeWidth = colWidth - NODE_INNER_MARGIN_X * 2;
      const libsNodeX = libsFrameX + NODE_INNER_MARGIN_X;
      const libsNodeWidth = colWidth - NODE_INNER_MARGIN_X * 2;

      const children: RFNode[] = [];

      let currentServiceY = bodyTop + SERVICES_BOX_PADDING_TOP + LABEL_OFFSET;
      servicesForMachine.forEach((service) => {
        children.push({
          id: service.id,
          type: "service",
          parentId: machineId,
          extent: "parent",
          draggable: false,
          hidden: !detailsExpanded,
          position: {
            x: serviceNodeX,
            y: currentServiceY
          },
          style: {
            width: serviceNodeWidth
          },
          data: {
            label: service.label,
            theme,
            type: service.data?.type,
            ports: service.data?.ports
          }
        });

        currentServiceY += SERVICE_HEIGHT + GAP;
      });

      let currentLibY = bodyTop + LIBS_BOX_PADDING_TOP + LABEL_OFFSET;
      libsForMachine.forEach((library) => {
        children.push({
          id: library.id,
          type: "library",
          parentId: machineId,
          extent: "parent",
          draggable: false,
          hidden: !detailsExpanded,
          position: {
            x: libsNodeX,
            y: currentLibY
          },
          style: {
            width: libsNodeWidth
          },
          data: {
            label: library.label,
            theme,
            version: library.data?.version,
            path: library.data?.path
          }
        });

        currentLibY += LIB_HEIGHT + GAP;
      });

      return children;
    };

    const childNodes = layoutedMachines.flatMap((machineNode) =>
      buildChildren(machineNode)
    );

    const positionedMachines = layoutedMachines.map((machineNode) => {
      if (layoutMode === "auto") {
        const auto = autoPositions[machineNode.id];
        if (auto) {
          return {
            ...machineNode,
            draggable: false,
            position: { x: auto.x, y: auto.y }
          };
        }
        return { ...machineNode, draggable: false };
      }

      const saved = nodePositions[machineNode.id];
      return saved ? { ...machineNode, position: saved } : machineNode;
    });

    return [...positionedMachines, ...childNodes];
  }, [
    autoPositions,
    edges,
    layoutMode,
    machineDetailsExpanded,
    nodeAdjustments,
    nodePositions,
    nodes,
    onNodeAdjust,
    onToggleMachineDetails,
    theme
  ]);

  const layoutEdges = useMemo(() => {
    const rfEdges: RFEdge[] = edges.map((edge) => {
      const sourceNode = nodes.find((node) => node.id === edge.from);
      const targetNode = nodes.find((node) => node.id === edge.to);
      const raiseOverMachines =
        (sourceNode && sourceNode.kind !== "machine") ||
        (targetNode && targetNode.kind !== "machine");
      const hidden =
        !showEdges || hiddenNodeIds.has(edge.from) || hiddenNodeIds.has(edge.to);

      const adjustments = edgeAdjustments[edge.id] ?? {};
      const color = edge.color ?? "#0f172a";
      const baseStyle =
        edge.kind === "depends_on"
          ? { strokeDasharray: "4 2", strokeWidth: 1.2 }
          : { strokeWidth: 1.6 };
      const isStraight = edgeShape === "straight";
      const bend = (isStraight ? 0 : adjustments.bend) ?? edge.bend ?? 0;

      const labelOffset = {
        x: adjustments.labelOffset?.x ?? edge.labelOffset?.x ?? 0,
        y: adjustments.labelOffset?.y ?? edge.labelOffset?.y ?? 0
      };

      const curveOffset = {
        x: isStraight
          ? 0
          : adjustments.curveOffset?.x ?? edge.curveOffset?.x ?? 0,
        y: isStraight
          ? 0
          : adjustments.curveOffset?.y ?? edge.curveOffset?.y ?? 0
      };

      return {
        id: edge.id,
        source: edge.from,
        target: edge.to,
        hidden,
        animated: edge.kind === "communicates_with",
        type: "adjustable",
        style: {
          ...baseStyle,
          stroke: color
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color
        },
        data: {
          label: edge.label,
          bend,
          labelOffset,
          color,
          curveOffset,
          raiseOverMachines,
          useStraight: isStraight,
          onCurveOffsetChange:
            editEdgesMode && !isStraight
              ? (offset: { x: number; y: number }) =>
                  onEdgeAdjust(edge.id, { curveOffset: offset })
              : undefined
        }
      };
    });

    return rfEdges;
  }, [
    edgeAdjustments,
    edgeShape,
    editEdgesMode,
    edges,
    hiddenNodeIds,
    nodes,
    onEdgeAdjust,
    showEdges
  ]);

  useEffect(() => {
    if (layoutMode !== "auto") {
      setAutoPositions({});
      return;
    }

    const machines = nodes.filter((node) => node.kind === "machine");
    if (machines.length === 0) {
      setAutoPositions({});
      return;
    }

    const servicesByMachine = new Map<string, GraphNode[]>();
    const libsByMachine = new Map<string, GraphNode[]>();

    nodes.forEach((node) => {
      if (node.kind === "service" && node.host) {
        if (!servicesByMachine.has(node.host)) {
          servicesByMachine.set(node.host, []);
        }
        servicesByMachine.get(node.host)!.push(node);
      }

      if (node.kind === "library" && node.host) {
        if (!libsByMachine.has(node.host)) {
          libsByMachine.set(node.host, []);
        }
        libsByMachine.get(node.host)!.push(node);
      }
    });

    const edgesBetweenMachines = edges
      .map((edge) => {
        const fromNode = nodes.find((node) => node.id === edge.from);
        const toNode = nodes.find((node) => node.id === edge.to);
        const fromHost =
          fromNode?.kind === "machine" ? fromNode.id : fromNode?.host;
        const toHost = toNode?.kind === "machine" ? toNode.id : toNode?.host;

        if (!fromHost || !toHost || fromHost === toHost) return null;

        return { id: edge.id, sources: [fromHost], targets: [toHost] };
      })
      .filter(
        (
          edge
        ): edge is { id: string; sources: string[]; targets: string[] } =>
          edge !== null
      );

    const graph = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.spacing.nodeNode": "120",
        "elk.layered.spacing.nodeNodeBetweenLayers": "160",
        "elk.direction": "DOWN"
      },
      children: machines.map((machine) => {
        const manualSize = nodeAdjustments[machine.id] ?? {};
        const metrics = buildMachineLayoutMetrics({
          serviceCount: (servicesByMachine.get(machine.id) ?? []).length,
          libraryCount: (libsByMachine.get(machine.id) ?? []).length,
          manualSize,
          detailsExpanded: Boolean(machineDetailsExpanded[machine.id])
        });

        return {
          id: machine.id,
          width: metrics.width,
          height: metrics.height
        };
      }),
      edges: edgesBetweenMachines
    };

    elk
      .layout(graph)
      .then((result) => {
        const positions: Record<string, { x: number; y: number }> = {};

        result.children?.forEach((child) => {
          if (child.id && child.x != null && child.y != null) {
            positions[child.id] = { x: child.x, y: child.y };
          }
        });

        setAutoPositions(positions);
      })
      .catch(() => {
        // ignore layout errors
      });
  }, [edges, elk, layoutMode, machineDetailsExpanded, nodeAdjustments, nodes]);

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

      setFlowNodes((currentNodes) => {
        let changedPosition = false;
        const updated = applyNodeChanges(changes, currentNodes);
        const resolved = resolveMachineOverlaps(updated, currentNodes);
        const positions: Record<string, { x: number; y: number }> = {};

        changes.forEach((change) => {
          if (change.type === "position" && change.position && change.id) {
            const node = resolved.find((item) => item.id === change.id);
            const prev = currentNodes.find((item) => item.id === change.id);

            if (
              node &&
              node.type === "machine" &&
              !node.parentNode &&
              (!prev ||
                prev.position.x !== node.position.x ||
                prev.position.y !== node.position.y)
            ) {
              positions[change.id] = {
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
