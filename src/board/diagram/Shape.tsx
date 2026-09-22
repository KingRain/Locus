"use client";

import type { ShapeData } from "../../../liveblocks.config";
import {
  center,
  shapeEdgePoint,
  invertStrokeForDark,
  invertFillForDark,
  getTextColorForFill,
} from "@/board/diagram/canvas-utils";
import { computePretextLayout } from "@/board/diagram/pretext-text";
import { getShapeDefinition } from "@/board/diagram/shapes/shape-library";

const NO_BODY_FILL_SHAPES = new Set([
  "Actor",
  "Start",
  "Fork/Join",
  "Destruction",
  "Return",
  "Found Message 1",
  "Found Message (variant)",
  "Association 1",
  "Relation 1",
  "Relation 2",
  "Aggregation 1",
  "Composition 1",
  "Dependency",
  "Generalization",
  "Implementation",
  "Required Interface",
]);

export function Shape({
  element,
  selected,
  others,
  darkMode,
}: {
  element: ShapeData;
  selected: boolean;
  others: ShapeData[];
  darkMode: boolean;
}) {
  const effectiveStroke = selected ? "#ff5858" : invertStrokeForDark(element.stroke, darkMode);
  const effectiveFill = invertFillForDark(element.fill, darkMode);
  const textColor = getTextColorForFill(effectiveFill, darkMode);
  const stroke = effectiveStroke;
  const strokeDasharray = element.strokeStyle === "dashed" ? "8 4" : element.strokeStyle === "dotted" ? "2 4" : undefined;
  const common = { fill: effectiveFill, stroke, strokeWidth: selected ? 3 : 2 };
  const align = element.textAlign ?? "left";

  if (element.type === "image") {
    return (
      <g>
        <image
          href={element.text}
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          preserveAspectRatio="none"
        />
        {selected && (
          <rect
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            fill="none"
            stroke="#ff5858"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        )}
      </g>
    );
  }

  if (element.type === "path") {
    return (
      <path
        d={element.text}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
      />
    );
  }

  if (element.type === "line" || element.type === "arrow") {
    const hasCurve = element.cx !== 0 || element.cy !== 0;
    if (hasCurve) {
      const d = `M ${element.x} ${element.y} Q ${element.cx} ${element.cy} ${element.width} ${element.height}`;
      return (
        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeDasharray={strokeDasharray}
          markerEnd={element.type === "arrow" ? "url(#arrow)" : undefined}
        />
      );
    }
    return (
      <line
        x1={element.x}
        y1={element.y}
        x2={element.width}
        y2={element.height}
        stroke={stroke}
        strokeWidth={2}
        strokeDasharray={strokeDasharray}
        markerEnd={element.type === "arrow" ? "url(#arrow)" : undefined}
      />
    );
  }

  if (element.type === "connector") {
    const from = others.find((item) => item.id === element.fromId);
    const to = others.find((item) => item.id === element.toId);
    if (!from || !to) return null;
    const fromCenter = center(from);
    const toCenter = center(to);
    const start = shapeEdgePoint(toCenter, from);
    const end = shapeEdgePoint(fromCenter, to);
    return (
      <g>
        <line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={stroke}
          strokeWidth={2}
          markerEnd="url(#arrow)"
        />
        {element.text ? (
          <text
            x={(start.x + end.x) / 2}
            y={(start.y + end.y) / 2 - 8}
            textAnchor="middle"
            fontSize="12"
            fill={darkMode ? "#e8eaf2" : "#151b31"}
          >
            {element.text}
          </text>
        ) : null}
      </g>
    );
  }

  if (element.type === "ellipse") {
    const pretextLayout = computePretextLayout(element.text, element.width, element.height, { targetFontSize: element.fontSize });
    const fontSize = element.fontSize ?? pretextLayout.fontSize;
    return (
      <g>
        <ellipse
          cx={element.x + element.width / 2}
          cy={element.y + element.height / 2}
          rx={element.width / 2}
          ry={element.height / 2}
          {...common}
        />
        <foreignObject
          x={element.x + element.width * 0.15}
          y={element.y + element.height * 0.15}
          width={Math.max(10, element.width * 0.7)}
          height={Math.max(10, element.height * 0.7)}
          className="pointer-events-none overflow-hidden"
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              fontSize: `${fontSize}px`,
              lineHeight: 1.3,
              color: textColor,
              textAlign: align,
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {element.text}
          </div>
        </foreignObject>
      </g>
    );
  }

  if (element.type === "diamond") {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    const points = `${cx},${element.y} ${element.x + element.width},${cy} ${cx},${element.y + element.height} ${element.x},${cy}`;
    const pretextLayout = computePretextLayout(element.text, element.width, element.height, { targetFontSize: element.fontSize });
    const fontSize = element.fontSize ?? pretextLayout.fontSize;
    return (
      <g>
        <polygon points={points} {...common} />
        <foreignObject
          x={element.x + element.width * 0.2}
          y={element.y + element.height * 0.2}
          width={Math.max(10, element.width * 0.6)}
          height={Math.max(10, element.height * 0.6)}
          className="pointer-events-none overflow-hidden"
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              fontSize: `${fontSize}px`,
              lineHeight: 1.3,
              color: textColor,
              textAlign: align,
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {element.text}
          </div>
        </foreignObject>
      </g>
    );
  }

  if (element.type === "text") {
    const fontSize = element.fontSize ?? 16;
    const rawTextColor =
      element.stroke && element.stroke !== "none" && element.stroke !== "#ffffff"
        ? element.stroke
        : element.fill && element.fill !== "#ffffff" && element.fill !== "none"
        ? element.fill
        : null;
    const textElementColor = rawTextColor
      ? invertStrokeForDark(rawTextColor, darkMode)
      : darkMode
      ? "#e8eaf2"
      : "#151b31";

    return (
      <foreignObject
        x={element.x}
        y={element.y}
        width={Math.max(20, element.width)}
        height={Math.max(20, element.height)}
        className="pointer-events-none overflow-visible"
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            fontSize: `${fontSize}px`,
            lineHeight: 1.3,
            color: textElementColor,
            textAlign: align,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {element.text}
        </div>
      </foreignObject>
    );
  }

  if (element.type === "svg") {
    const def = element.shapeId ? getShapeDefinition(element.shapeId) : null;
    const rawMarkup = def?.svgMarkup || "";
    const resolvedFill =
      effectiveFill && effectiveFill !== "transparent" && effectiveFill !== "none"
        ? effectiveFill
        : "none";
    let markup = rawMarkup;
    const skipBodyFill = element.shapeId && NO_BODY_FILL_SHAPES.has(element.shapeId);
    if (resolvedFill !== "none" && !skipBodyFill) {
      if (element.shapeId === "Package") {
        markup = rawMarkup.replace(/fill="none"/g, `fill="${resolvedFill}"`);
      } else {
        markup = rawMarkup.replace('fill="none"', `fill="${resolvedFill}"`);
      }
    }
    const pretextLayout = computePretextLayout(element.text, element.width, element.height, { targetFontSize: element.fontSize });
    const fontSize = element.fontSize ?? pretextLayout.fontSize;
    
    return (
      <g>
        <svg
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ color: stroke }}
          dangerouslySetInnerHTML={{ __html: markup }}
        />
        {element.text && (
          <foreignObject
            x={element.x + 8}
            y={element.y + 8}
            width={Math.max(10, element.width - 16)}
            height={Math.max(10, element.height - 16)}
            className="pointer-events-none overflow-hidden"
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                fontSize: `${fontSize}px`,
                lineHeight: `${pretextLayout.lineHeight}px`,
                color: textColor,
                textAlign: align,
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {element.text}
            </div>
          </foreignObject>
        )}
        {selected && (
          <rect
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            fill="none"
            stroke="#ff5858"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        )}
      </g>
    );
  }

  const pretextLayout = computePretextLayout(element.text, element.width, element.height, { targetFontSize: element.fontSize });
  const fontSize = element.fontSize ?? pretextLayout.fontSize;

  return (
    <g>
      <rect
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rx={element.type === "sticky" ? 8 : 12}
        {...common}
      />
      <foreignObject
        x={element.x + 8}
        y={element.y + 8}
        width={Math.max(10, element.width - 16)}
        height={Math.max(10, element.height - 16)}
        className="pointer-events-none overflow-hidden"
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            fontSize: `${fontSize}px`,
            lineHeight: `${pretextLayout.lineHeight}px`,
            color: textColor,
            textAlign: align,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {element.text}
        </div>
      </foreignObject>
    </g>
  );
}
