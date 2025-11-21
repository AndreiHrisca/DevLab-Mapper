// src/components/diagram/edgeTypes/AdjustableEdge.tsx
import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  Position,
  useReactFlow
} from "reactflow";

type AdjustableEdgeData = {
  label?: string;
  bend?: number;
  labelOffset?: {
    x?: number;
    y?: number;
  };
  color?: string;
  curveOffset?: {
    x?: number;
    y?: number;
  };
  onCurveOffsetChange?: (offset: { x: number; y: number }) => void;
  raiseOverMachines?: boolean;
};

function cubicBezierPoint(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number
) {
  const oneMinusT = 1 - t;
  return (
    oneMinusT ** 3 * p0 +
    3 * oneMinusT ** 2 * t * p1 +
    3 * oneMinusT * t ** 2 * p2 +
    t ** 3 * p3
  );
}

export const AdjustableEdge: React.FC<EdgeProps<AdjustableEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}) => {
  const { project } = useReactFlow();
  const bend = data?.bend ?? 0;
  const curveOffsetX = data?.curveOffset?.x ?? 0;
  const curveOffsetY = data?.curveOffset?.y ?? 0;

  // Curvas suaves desplazadas verticalmente por "bend"
  const horizontalDelta = (targetX - sourceX) / 2;
  const controlX1 =
    sourcePosition === Position.Right
      ? sourceX + Math.max(horizontalDelta, 40)
      : sourceX - Math.max(Math.abs(horizontalDelta), 40);
  const controlX2 =
    targetPosition === Position.Left
      ? targetX - Math.max(horizontalDelta, 40)
      : targetX + Math.max(Math.abs(horizontalDelta), 40);

  const controlY1 = sourceY + bend;
  const controlY2 = targetY + bend;

  const adjustedControlX1 = controlX1 + curveOffsetX;
  const adjustedControlX2 = controlX2 + curveOffsetX;
  const adjustedControlY1 = controlY1 + curveOffsetY;
  const adjustedControlY2 = controlY2 + curveOffsetY;

  const path = `M ${sourceX},${sourceY} C ${adjustedControlX1},${adjustedControlY1} ${adjustedControlX2},${adjustedControlY2} ${targetX},${targetY}`;

  const labelPointX = cubicBezierPoint(
    0.5,
    sourceX,
    adjustedControlX1,
    adjustedControlX2,
    targetX
  );
  const labelPointY = cubicBezierPoint(
    0.5,
    sourceY,
    adjustedControlY1,
    adjustedControlY2,
    targetY
  );

  const offsetX = data?.labelOffset?.x ?? 0;
  const offsetY = data?.labelOffset?.y ?? 0;

  const labelColor = data?.color ?? "#0f172a";
  const strokeColor =
    (style?.stroke as string | undefined) ?? labelColor;
  const computedStrokeWidth =
    typeof style?.strokeWidth === "number"
      ? style.strokeWidth
      : style?.strokeWidth
      ? parseFloat(String(style.strokeWidth))
      : undefined;
  const strokeWidth = Number.isFinite(computedStrokeWidth)
    ? (computedStrokeWidth as number)
    : 1.6;
  const strokeDasharray =
    style?.strokeDasharray != null
      ? String(style.strokeDasharray)
      : undefined;

  const padding = 24;
  const pointsX = [
    sourceX,
    targetX,
    adjustedControlX1,
    adjustedControlX2
  ];
  const pointsY = [
    sourceY,
    targetY,
    adjustedControlY1,
    adjustedControlY2
  ];
  const minX = Math.min(...pointsX) - padding;
  const maxX = Math.max(...pointsX) + padding;
  const minY = Math.min(...pointsY) - padding;
  const maxY = Math.max(...pointsY) + padding;
  const overlayWidth = Math.max(maxX - minX, 1);
  const overlayHeight = Math.max(maxY - minY, 1);

  const overlayPath = `M ${sourceX - minX},${sourceY - minY} C ${adjustedControlX1 - minX},${adjustedControlY1 - minY} ${adjustedControlX2 - minX},${adjustedControlY2 - minY} ${targetX - minX},${targetY - minY}`;
  const overlayMarkerId = `${id}-overlay-arrow`;

  const handleCurvePointerDown = (
    event: React.PointerEvent<SVGPathElement | HTMLDivElement>
  ) => {
    if (!data?.onCurveOffsetChange) return;
    event.stopPropagation();
    event.preventDefault();

    const start = project({
      x: event.clientX,
      y: event.clientY
    });
    const initialOffset = {
      x: curveOffsetX,
      y: curveOffsetY
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const current = project({
        x: moveEvent.clientX,
        y: moveEvent.clientY
      });
      const deltaX = current.x - start.x;
      const deltaY = current.y - start.y;
      data.onCurveOffsetChange!({
        x: Math.round(initialOffset.x + deltaX),
        y: Math.round(initialOffset.y + deltaY)
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={style}
        markerEnd={markerEnd}
      />
      {data?.onCurveOffsetChange && (
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth={12}
          pointerEvents="stroke"
          style={{ cursor: "grab" }}
          onPointerDown={handleCurvePointerDown}
          className="nodrag nopan"
        />
      )}
      <EdgeLabelRenderer>
        <>
          {data?.raiseOverMachines && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: `translate(${minX}px, ${minY}px)`,
                pointerEvents: "none",
                zIndex: 20
              }}
            >
              <svg
                width={overlayWidth}
                height={overlayHeight}
                style={{ overflow: "visible", pointerEvents: "auto" }}
              >
                <defs>
                  <marker
                    id={overlayMarkerId}
                    markerWidth={10}
                    markerHeight={10}
                    refX={10}
                    refY={5}
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path
                      d="M0,0 L10,5 L0,10 z"
                      fill={strokeColor}
                    />
                  </marker>
                </defs>
                <path
                  d={overlayPath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  markerEnd={`url(#${overlayMarkerId})`}
                  style={{ cursor: "grab", pointerEvents: "stroke" }}
                  onPointerDown={handleCurvePointerDown}
                />
              </svg>
            </div>
          )}
          {data?.onCurveOffsetChange && (
            <div
              onPointerDown={handleCurvePointerDown}
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelPointX}px, ${labelPointY}px)`,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#fff",
                border: `2px solid ${labelColor}`,
                boxShadow: "0 4px 6px rgba(15,23,42,0.18)",
                cursor: "grab"
              }}
              className="nodrag nopan"
              title="Arrastra para mover la flecha"
            />
          )}
          {data?.label && (
            <div
              onPointerDown={
                data?.onCurveOffsetChange ? handleCurvePointerDown : undefined
              }
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelPointX + offsetX}px, ${labelPointY + offsetY}px)`,
                background: "rgba(255,255,255,0.95)",
                borderRadius: 8,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 600,
                color: labelColor,
                border: `1px solid ${labelColor}33`,
                boxShadow: "0 2px 6px rgba(15,23,42,0.18)",
                pointerEvents: data?.onCurveOffsetChange ? "auto" : "none",
                cursor: data?.onCurveOffsetChange ? "grab" : "default",
                whiteSpace: "nowrap",
                userSelect: "none"
              }}
              className="nodrag nopan"
              title={
                data?.onCurveOffsetChange
                  ? "Arrastra para mover la flecha y su texto"
                  : undefined
              }
            >
              {data.label}
            </div>
          )}
        </>
      </EdgeLabelRenderer>
    </>
  );
};
