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

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean.charAt(0) + clean.charAt(0), 16),
      g: parseInt(clean.charAt(1) + clean.charAt(1), 16),
      b: parseInt(clean.charAt(2) + clean.charAt(2), 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h, s, l };
}

export function hslToHex(h: number, s: number, l: number): string {
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      let tc = t;
      if (tc < 0) tc += 1;
      if (tc > 1) tc -= 1;
      if (tc < 1 / 6) return p + (q - p) * 6 * tc;
      if (tc < 1 / 2) return q;
      if (tc < 2 / 3) return p + (q - p) * (2 / 3 - tc) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(Math.max(0, Math.min(255, x * 255))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function invertStrokeForDark(stroke: string, darkMode: boolean): string {
  if (!darkMode || !stroke || stroke === "none" || stroke === "transparent") {
    return stroke;
  }
  const lower = stroke.toLowerCase();
  if (lower === "#151b31") return "#e8eaf2";
  if (lower === "#000000" || lower === "#000" || lower === "#0a0a0a" || lower === "#141414") return "#ffffff";
  if (lower === "#333333" || lower === "#333") return "#d1d5db";
  if (lower === "#64748b") return "#94a3b8";
  if (lower === "#e8eaf2") return "#e8eaf2";

  const rgb = hexToRgb(stroke);
  if (!rgb) return stroke;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  if (hsl.l < 0.35) {
    return hslToHex(hsl.h, hsl.s, Math.min(0.92, 1 - hsl.l));
  }
  return stroke;
}

export function invertFillForDark(fill: string, darkMode: boolean): string {
  if (!darkMode || !fill || fill === "none" || fill === "transparent") {
    return fill;
  }
  const lower = fill.toLowerCase();
  if (lower === "#ffffff" || lower === "#fff" || lower === "#fefefe" || lower === "#f8f9fa") {
    return "#141414";
  }
  if (lower === "#f2f2f2" || lower === "#f5f5f4" || lower === "#e8e7e5" || lower === "#e7e5e4") {
    return "#1f1f1f";
  }
  if (lower === "#151b31") {
    return "#e8eaf2";
  }
  if (lower === "#000000" || lower === "#000") {
    return "#f5f5f4";
  }

  // Sticky yellow tones
  if (lower === "#fedf89" || lower === "#fef0c3" || lower === "#fef9e7") {
    return "#382e14";
  }
  // Mint tones
  if (lower === "#86e0c1" || lower === "#d4f5ea" || lower === "#a8ecd4") {
    return "#17382d";
  }
  // Coral tones
  if (lower === "#ff5858" || lower === "#ffe4e4" || lower === "#ffabab") {
    return "#421616";
  }

  const rgb = hexToRgb(fill);
  if (!rgb) return fill;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const newL = hsl.l > 0.5 ? Math.max(0.12, 1 - hsl.l) : Math.min(0.88, 1 - hsl.l);
  return hslToHex(hsl.h, hsl.s, newL);
}

export function getTextColorForFill(effectiveFill: string, darkMode: boolean): string {
  if (!effectiveFill || effectiveFill === "none" || effectiveFill === "transparent") {
    return darkMode ? "#e8eaf2" : "#151b31";
  }
  const lower = effectiveFill.toLowerCase();
  if (
    lower === "#141414" ||
    lower === "#1f1f1f" ||
    lower === "#151b31" ||
    lower === "#000000" ||
    lower === "#382e14" ||
    lower === "#17382d" ||
    lower === "#421616"
  ) {
    return "#e8eaf2";
  }
  if (lower === "#ffffff" || lower === "#f2f2f2" || lower === "#f5f5f4" || lower === "#e8eaf2") {
    return "#151b31";
  }
  const rgb = hexToRgb(effectiveFill);
  if (!rgb) return darkMode ? "#e8eaf2" : "#151b31";
  const lum = 0.299 * (rgb.r / 255) + 0.587 * (rgb.g / 255) + 0.114 * (rgb.b / 255);
  return lum < 0.5 ? "#ffffff" : "#151b31";
}
