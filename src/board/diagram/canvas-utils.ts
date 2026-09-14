import type { DiagramElementRecord } from "@/lib/types";

export const FILL_PALETTE = [
  // Neutrals
  "#ffffff",
  "#f5f5f4",
  "#e7e5e4",
  "#94a3b8",
  "#64748b",
  "#151b31",
  // Mint shades
  "#d4f5ea",
  "#a8ecd4",
  "#86e0c1",
  "#5cc9a8",
  "#3aab8c",
  // Butter shades
  "#fef9e7",
  "#fef0c3",
  "#fedf89",
  "#f5c842",
  "#e6a817",
  // Coral shades
  "#ffe4e4",
  "#ffabab",
  "#ff5858",
  "#e03e3e",
  "#c62828",
] as const;

export function distanceToSegment(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
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

function hitTestRect(elements: DiagramElementRecord[], p: { x: number; y: number }) {
  return [...elements]
    .reverse()
    .find(
      (el) =>
        el.type !== "connector" &&
        el.type !== "line" &&
        el.type !== "arrow" &&
        el.type !== "path" &&
        p.x >= el.x &&
        p.x <= el.x + el.width &&
        p.y >= el.y &&
        p.y <= el.y + el.height,
    );
}

function hitTestStroke(elements: DiagramElementRecord[], p: { x: number; y: number }, threshold = 10) {
  return [...elements].reverse().find((el) => {
    if (el.type === "line" || el.type === "arrow") {
      return (
        distanceToSegment(p, { x: el.x, y: el.y }, { x: el.width, y: el.height }) < threshold
      );
    }
    if (el.type === "path") {
      const pts = parsePathPoints(el.text);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        if (a && b && distanceToSegment(p, a, b) < threshold) return true;
      }
    }
    return false;
  });
}

export function hitTest(elements: DiagramElementRecord[], p: { x: number; y: number }) {
  return hitTestRect(elements, p) ?? hitTestStroke(elements, p);
}

export function hitTestEraser(elements: DiagramElementRecord[], p: { x: number; y: number }) {
  return hitTestStroke(elements, p, 12) ?? hitTestRect(elements, p);
}

export function elementIntersectsRect(
  el: DiagramElementRecord,
  rect: { x: number; y: number; width: number; height: number },
) {
  if (el.type === "line" || el.type === "arrow") {
    const minX = Math.min(el.x, el.width);
    const maxX = Math.max(el.x, el.width);
    const minY = Math.min(el.y, el.height);
    const maxY = Math.max(el.y, el.height);
    return !(
      maxX < rect.x ||
      minX > rect.x + rect.width ||
      maxY < rect.y ||
      minY > rect.y + rect.height
    );
  }
  if (el.type === "path") {
    const pts = parsePathPoints(el.text);
    return pts.some(
      (pt) =>
        pt.x >= rect.x &&
        pt.x <= rect.x + rect.width &&
        pt.y >= rect.y &&
        pt.y <= rect.y + rect.height,
    );
  }
  if (el.type === "connector") return false;
  return !(
    el.x + el.width < rect.x ||
    el.x > rect.x + rect.width ||
    el.y + el.height < rect.y ||
    el.y > rect.y + rect.height
  );
}

export function center(el: DiagramElementRecord) {
  return { x: el.x + el.width / 2, y: el.y + el.height / 2 };
}

/** Point on shape boundary along ray from `from` toward shape center. */
export function shapeEdgePoint(
  from: { x: number; y: number },
  shape: DiagramElementRecord,
): { x: number; y: number } {
  const c = center(shape);
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

export function translatePath(d: string, dx: number, dy: number): string {
  return d.replace(/([ML])\s*([-\d.]+)\s+([-\d.]+)/g, (_match, cmd, xStr, yStr) => {
    const x = Number.parseFloat(xStr) + dx;
    const y = Number.parseFloat(yStr) + dy;
    return `${cmd} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });
}

export function getPathBounds(d: string): { x: number; y: number; width: number; height: number } {
  const pts = parsePathPoints(d);
  if (pts.length === 0) return { x: 0, y: 0, width: 50, height: 50 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(20, maxX - minX),
    height: Math.max(20, maxY - minY),
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
