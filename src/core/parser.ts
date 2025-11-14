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
 * - Crea nodos "service" para cada servicio con host = machine.id
 * - Crea nodos "library" para cada librería con host = machine.id
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
 * Convierte los EdgeJson en GraphEdge, filtrando los que apunten
 * a nodos inexistentes (para no romper el diagrama).
 */
function buildGraphEdges(
  lab: LabJson,
  validNodeIds: Set<string>
): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (const edge of lab.edges) {
    if (!validNodeIds.has(edge.from) || !validNodeIds.has(edge.to)) {
      // Aquí podrías loguear un warning en consola si quieres
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
 * Función principal: recibe el JSON tal como lo has definido y lo
 * convierte en nodos y edges internos.
 */
export function buildGraphFromLabJson(lab: LabJson): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = [];

  // 1. Aplanar máquinas + servicios + librerías
  lab.nodes.forEach((machine, index) => {
    const machineNodes = buildNodesFromMachine(machine, index);
    nodes.push(...machineNodes);
  });

  // 2. Construir edges validando from/to
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = buildGraphEdges(lab, nodeIds);

  return { nodes, edges };
}
