// src/core/parser.ts
import {
  LabJson,
  GraphNode,
  GraphEdge,
  MachineNodeJson,
  Service,
  Library,
} from "./types";

/**
 * Construye los GraphNode a partir de un MachineNodeJson.
 * - Crea un nodo "machine"
 * - Crea nodos "service" para cada servicio
 * - Crea nodos "library" para cada librería
 */
function buildNodesFromMachine(
  machine: MachineNodeJson,
  machineIndex: number
): GraphNode[] {
  const result: GraphNode[] = [];

  // Nodo de máquina
  result.push({
    id: machine.id,
    label: machine.label,
    kind: "machine",
    jsonRefPath: `nodes[${machineIndex}]`,
    data: machine,
  });

  // Servicios
  (machine.services ?? []).forEach((svc: Service, svcIndex: number) => {
    result.push({
      id: svc.id,
      label: svc.label,
      kind: "service",
      host: machine.id,
      parentId: machine.id,
      jsonRefPath: `nodes[${machineIndex}].services[${svcIndex}]`,
      data: svc,
    });
  });

  // Librerías
  (machine.libraries ?? []).forEach((lib: Library, libIndex: number) => {
    result.push({
      id: lib.id,
      label: lib.label,
      kind: "library",
      host: machine.id,
      parentId: machine.id,
      jsonRefPath: `nodes[${machineIndex}].libraries[${libIndex}]`,
      data: lib,
    });
  });

  return result;
}

/**
 * Construye edges válidos entre nodos existentes.
 */
function buildGraphEdges(
  lab: LabJson,
  validNodeIds: Set<string>
): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (const edge of lab.edges) {
    if (!validNodeIds.has(edge.from) || !validNodeIds.has(edge.to)) {
      console.warn(
        `[parser] Edge "${edge.id}" ignorado: from/to no existen`,
        edge
      );
      continue;
    }

    edges.push({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      kind: edge.kind,
      label: edge.label,
      data: edge.meta ?? {},
    });
  }

  return edges;
}

/**
 * Conversión principal del JSON a GraphNodes y GraphEdges.
 */
export function buildGraphFromLabJson(lab: LabJson): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = [];

  // Aplanar máquinas + servicios + librerías
  lab.nodes.forEach((machine, index) => {
    const machineNodes = buildNodesFromMachine(machine, index);
    nodes.push(...machineNodes);
  });

  // Construir edges
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = buildGraphEdges(lab, nodeIds);

  return { nodes, edges };
}

/**
 * Alias simple para la UI.
 */
export function parseLabJson(raw: any) {
  return buildGraphFromLabJson(raw as LabJson);
}
