import { describe, expect, it } from "vitest";
import { resolveMachineOverlaps } from "./DiagramCanvas";
import { Node as RFNode } from "reactflow";

const baseMachine = (id: string, x: number, y: number): RFNode => ({
  id,
  type: "machine",
  position: { x, y },
  data: {},
  style: { width: 400, height: 280 }
});

describe("resolveMachineOverlaps", () => {
  it("conserva la nueva posición si no hay solape", () => {
    const prev = [baseMachine("a", 0, 0), baseMachine("b", 500, 0)];
    const updated = [
      baseMachine("a", 20, 10),
      baseMachine("b", 520, 20)
    ];

    const resolved = resolveMachineOverlaps(updated, prev);
    expect(resolved.map((n) => n.position)).toEqual([
      { x: 20, y: 10 },
      { x: 520, y: 20 }
    ]);
  });

  it("revierte la posición cuando dos máquinas se solapan", () => {
    const prev = [baseMachine("a", 0, 0), baseMachine("b", 500, 0)];
    const updated = [
      baseMachine("a", 0, 0),
      baseMachine("b", 100, 50) // solapa con A
    ];

    const resolved = resolveMachineOverlaps(updated, prev);
    const machineB = resolved.find((n) => n.id === "b");
    expect(machineB?.position).toEqual({ x: 500, y: 0 });
  });

  it("no toca otros nodos no-máquina", () => {
    const prev: RFNode[] = [
      baseMachine("a", 0, 0),
      {
        id: "svc-1",
        type: "service",
        position: { x: 10, y: 10 },
        parentId: "a",
        data: {}
      }
    ];

    const updated: RFNode[] = [
      baseMachine("a", 0, 0),
      {
        id: "svc-1",
        type: "service",
        position: { x: 20, y: 20 },
        parentId: "a",
        data: {}
      }
    ];

    const resolved = resolveMachineOverlaps(updated, prev);
    const svc = resolved.find((n) => n.id === "svc-1");
    expect(svc?.position).toEqual({ x: 20, y: 20 });
  });
});
