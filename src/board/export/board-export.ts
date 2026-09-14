import { getShapeDefinition } from "@/board/diagram/shapes/shape-library";
import type { ShapeData } from "../../../liveblocks.config";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parsePathPoints(d: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const tokens = d.match(/[ML]\s*[-\d.]+(?:\s+[-\d.]+)*/g) ?? [];
  for (const token of tokens) {
    const parts = token.trim().split(/\s+/);
    const x = Number.parseFloat(parts[1] ?? "0");
    const y = Number.parseFloat(parts[2] ?? "0");
    if (!Number.isNaN(x) && !Number.isNaN(y)) points.push({ x, y });
  }
  return points;
}

function getCenter(el: { x: number; y: number; width: number; height: number }) {
  return { x: el.x + el.width / 2, y: el.y + el.height / 2 };
}

function getShapeEdgePoint(
  from: { x: number; y: number },
  shape: { type: string; x: number; y: number; width: number; height: number },
): { x: number; y: number } {
  const c = getCenter(shape);
  const dx = c.x - from.x;
  const dy = c.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return c;

  const ux = dx / len;
  const uy = dy / len;

  if (shape.type === "ellipse") {
    const rx = shape.width / 2;
    const ry = shape.height / 2;
    const denom = Math.sqrt((ux * ux) / (rx * rx) + (uy * uy) / (ry * ry));
    const t = denom === 0 ? 0 : 1 / denom;
    return { x: c.x - ux * t, y: c.y - uy * t };
  }

  const halfW = shape.width / 2;
  const halfH = shape.height / 2;
  const tX = ux !== 0 ? halfW / Math.abs(ux) : Infinity;
  const tY = uy !== 0 ? halfH / Math.abs(uy) : Infinity;
  const t = Math.min(tX, tY);
  return { x: c.x - ux * t, y: c.y - uy * t };
}

export function computeBoardBounds(elements: ShapeData[], padding = 60) {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600, padding };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    if (el.type === "line" || el.type === "arrow") {
      const hasCurve = (el.cx ?? 0) !== 0 || (el.cy ?? 0) !== 0;
      minX = Math.min(minX, el.x, el.width);
      minY = Math.min(minY, el.y, el.height);
      maxX = Math.max(maxX, el.x, el.width);
      maxY = Math.max(maxY, el.y, el.height);
      if (hasCurve) {
        minX = Math.min(minX, el.cx);
        minY = Math.min(minY, el.cy);
        maxX = Math.max(maxX, el.cx);
        maxY = Math.max(maxY, el.cy);
      }
    } else if (el.type === "path") {
      const pts = parsePathPoints(el.text ?? "");
      if (pts.length > 0) {
        for (const p of pts) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        }
      } else {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
      }
    } else if (el.type === "connector") {
      const from = elements.find((item) => item.id === el.fromId);
      const to = elements.find((item) => item.id === el.toId);
      if (from && to) {
        const fromC = getCenter(from);
        const toC = getCenter(to);
        const start = getShapeEdgePoint(toC, from);
        const end = getShapeEdgePoint(fromC, to);
        minX = Math.min(minX, start.x, end.x);
        minY = Math.min(minY, start.y, end.y);
        maxX = Math.max(maxX, start.x, end.x);
        maxY = Math.max(maxY, start.y, end.y);
      }
    } else {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    }
  }

  minX = Math.floor(minX - padding);
  minY = Math.floor(minY - padding);
  maxX = Math.ceil(maxX + padding);
  maxY = Math.ceil(maxY + padding);

  const width = Math.max(400, maxX - minX);
  const height = Math.max(300, maxY - minY);

  return { minX, minY, maxX, maxY, width, height, padding };
}

function renderElementSvg(element: ShapeData, allElements: ShapeData[]): string {
  const strokeDash =
    element.strokeStyle === "dashed"
      ? ' stroke-dasharray="8,4"'
      : element.strokeStyle === "dotted"
      ? ' stroke-dasharray="2,4"'
      : "";

  const commonProps = `fill="${element.fill}" stroke="${element.stroke}" stroke-width="2"${strokeDash}`;
  const align = element.textAlign ?? "left";
  const fontSize = element.fontSize ?? (element.type === "text" ? 16 : 14);
  const textColor = element.fill === "#151b31" ? "#ffffff" : "#151b31";

  // Helper for foreignObject multiline text
  const renderTextContent = (x: number, y: number, width: number, height: number) => {
    if (!element.text) return "";
    const safeText = escapeXml(element.text);
    return `<foreignObject x="${x}" y="${y}" width="${width}" height="${height}" style="overflow: visible;">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; font-size: ${fontSize}px; line-height: 1.3; color: ${textColor}; text-align: ${align}; word-break: break-word; white-space: pre-wrap; display: flex; flex-direction: column; justify-content: center; align-items: ${align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start"}; font-family: Inter, system-ui, -apple-system, sans-serif;">
        ${safeText}
      </div>
    </foreignObject>`;
  };

  if (element.type === "image") {
    return `<g id="${element.id}">
      <image href="${escapeXml(element.text)}" x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" preserveAspectRatio="none" />
    </g>`;
  }

  if (element.type === "path") {
    return `<path id="${element.id}" d="${escapeXml(element.text)}" fill="none" stroke="${element.stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"${strokeDash} />`;
  }

  if (element.type === "line" || element.type === "arrow") {
    const hasCurve = (element.cx ?? 0) !== 0 || (element.cy ?? 0) !== 0;
    const marker = element.type === "arrow" ? ` marker-end="url(#arrow-${element.stroke.replace("#", "")})"` : "";
    if (hasCurve) {
      const d = `M ${element.x} ${element.y} Q ${element.cx} ${element.cy} ${element.width} ${element.height}`;
      return `<path id="${element.id}" d="${d}" fill="none" stroke="${element.stroke}" stroke-width="2" stroke-linecap="round"${strokeDash}${marker} />`;
    }
    return `<line id="${element.id}" x1="${element.x}" y1="${element.y}" x2="${element.width}" y2="${element.height}" stroke="${element.stroke}" stroke-width="2" stroke-linecap="round"${strokeDash}${marker} />`;
  }

  if (element.type === "connector") {
    const from = allElements.find((item) => item.id === element.fromId);
    const to = allElements.find((item) => item.id === element.toId);
    if (!from || !to) return "";
    const fromCenter = getCenter(from);
    const toCenter = getCenter(to);
    const start = getShapeEdgePoint(toCenter, from);
    const end = getShapeEdgePoint(fromCenter, to);
    const marker = ` marker-end="url(#arrow-${element.stroke.replace("#", "")})"`;
    const labelText = element.text
      ? `<text x="${(start.x + end.x) / 2}" y="${(start.y + end.y) / 2 - 8}" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="${textColor}">${escapeXml(element.text)}</text>`
      : "";

    return `<g id="${element.id}">
      <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="${element.stroke}" stroke-width="2"${strokeDash}${marker} />
      ${labelText}
    </g>`;
  }

  if (element.type === "ellipse") {
    return `<g id="${element.id}">
      <ellipse cx="${element.x + element.width / 2}" cy="${element.y + element.height / 2}" rx="${element.width / 2}" ry="${element.height / 2}" ${commonProps} />
      ${renderTextContent(element.x + element.width * 0.15, element.y + element.height * 0.15, Math.max(10, element.width * 0.7), Math.max(10, element.height * 0.7))}
    </g>`;
  }

  if (element.type === "diamond") {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    const points = `${cx},${element.y} ${element.x + element.width},${cy} ${cx},${element.y + element.height} ${element.x},${cy}`;
    return `<g id="${element.id}">
      <polygon points="${points}" ${commonProps} />
      ${renderTextContent(element.x + element.width * 0.2, element.y + element.height * 0.2, Math.max(10, element.width * 0.6), Math.max(10, element.height * 0.6))}
    </g>`;
  }

  if (element.type === "text") {
    return `<g id="${element.id}">
      ${renderTextContent(element.x, element.y, Math.max(20, element.width), Math.max(20, element.height))}
    </g>`;
  }

  if (element.type === "svg") {
    const def = element.shapeId ? getShapeDefinition(element.shapeId) : null;
    const markup = def?.svgMarkup || "";
    // Transform color inside markup to match stroke
    const coloredMarkup = markup.replaceAll('stroke="currentColor"', `stroke="${element.stroke}"`).replaceAll('fill="currentColor"', `fill="${element.fill}"`);
    return `<g id="${element.id}">
      <g transform="translate(${element.x}, ${element.y}) scale(${element.width / 100}, ${element.height / 100})">
        ${coloredMarkup}
      </g>
      ${renderTextContent(element.x + 8, element.y + 8, Math.max(10, element.width - 16), Math.max(10, element.height - 16))}
    </g>`;
  }

  // Fallback: rect / sticky / general shape
  const rx = element.type === "sticky" ? 8 : 12;
  return `<g id="${element.id}">
    <rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rx="${rx}" ${commonProps} />
    ${renderTextContent(element.x + 8, element.y + 8, Math.max(10, element.width - 16), Math.max(10, element.height - 16))}
  </g>`;
}

export function generateBoardSvg(
  boardTitle: string,
  elements: ShapeData[],
  options: { darkMode?: boolean; showTitle?: boolean } = {},
): string {
  const { darkMode = false, showTitle = true } = options;
  const bounds = computeBoardBounds(elements, 60);

  // Sort elements by zIndex ascending so back elements render first
  const sorted = [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  // Extract unique stroke colors for arrow markers
  const uniqueStrokes = Array.from(
    new Set(sorted.map((el) => el.stroke).filter(Boolean)),
  );
  if (!uniqueStrokes.includes("#151b31")) uniqueStrokes.push("#151b31");

  const arrowMarkers = uniqueStrokes
    .map((stroke) => {
      const id = stroke.replace("#", "");
      return `<marker id="arrow-${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="${stroke}" />
      </marker>`;
    })
    .join("\n");

  const elementsSvg = sorted.map((el) => renderElementSvg(el, sorted)).join("\n");
  const bgColor = darkMode ? "#0f172a" : "#f8fafc";
  const titleColor = darkMode ? "#f8fafc" : "#0f172a";

  const titleHeader = showTitle
    ? `<text x="${bounds.minX + 24}" y="${bounds.minY + 36}" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="600" fill="${titleColor}">${escapeXml(boardTitle)}</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" stroke-width="0"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap');
      text, div { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    </style>
    ${arrowMarkers}
  </defs>
  <rect x="${bounds.minX}" y="${bounds.minY}" width="${bounds.width}" height="${bounds.height}" fill="${bgColor}" rx="12" />
  ${titleHeader}
  ${elementsSvg}
</svg>`;
}

export async function exportBoardToPng(
  svgString: string,
  width: number,
  height: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Scale canvas 2x for high DPI sharpness
      const scale = 2;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("PNG conversion failed"));
        }
      }, "image/png");
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };

    img.src = url;
  });
}
