import { describe, expect, it, vi } from "vitest";
import { buildGraphFromLabJson } from "./parser";
import { LabJson } from "./types";

const baseLab: LabJson = {
  lab: {
    name: "Test Lab",
    description: "Parser test lab",
    version: "1.0",
    author: "QA",
    updatedAt: "2026-03-03T00:00:00Z"
  },
  nodes: [
    {
      id: "machine-1",
      label: "Machine 1",
      type: "machine",
      os: "linux",
      services: [
        {
          id: "svc-1",
          label: "Service 1",
          type: "api"
        }
      ],
      libraries: [
        {
          id: "lib-1",
          label: "Library 1",
          type: "npm"
        }
      ]
    }
  ],
  edges: [
    {
      id: "edge-1",
      from: "svc-1",
      to: "lib-1",
      kind: "depends_on",
      label: "uses"
    }
  ]
};

describe("buildGraphFromLabJson", () => {
  it("aplana máquinas, servicios y librerías y conserva edges válidos", () => {
    const { nodes, edges } = buildGraphFromLabJson(baseLab);

    expect(nodes.map((n) => n.id)).toEqual(["machine-1", "svc-1", "lib-1"]);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      id: "edge-1",
      from: "svc-1",
      to: "lib-1",
      kind: "depends_on"
    });
  });

  it("ignora edges que apuntan a nodos inexistentes", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const badEdgeLab: LabJson = {
      ...baseLab,
      edges: [
        ...baseLab.edges,
        {
          id: "edge-bad",
          from: "missing-from",
          to: "svc-1",
          kind: "depends_on"
        }
      ]
    };

    const { edges } = buildGraphFromLabJson(badEdgeLab);
    expect(edges.map((e) => e.id)).toEqual(["edge-1"]);
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });
});
