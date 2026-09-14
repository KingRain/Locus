import type { ElementType } from "@/lib/types";

export interface ShapeDefinition {
  type: ElementType;
  width: number;
  height: number;
  svgMarkup?: string; // used for sidebar display and 'svg' type rendering
  rx?: number;
  text?: string;
  textAlign?: "left" | "center" | "right";
}

const REGISTRY: Record<string, ShapeDefinition> = {
  // 1. Basic Shapes
  "Rectangle": { type: "rect", width: 240, height: 160, svgMarkup: `<rect x="10" y="25" width="80" height="50" fill="none" stroke="currentColor" stroke-width="1"  />` },
  "Rounded Rectangle": { type: "rect", width: 240, height: 160, rx: 12, svgMarkup: `<rect x="10" y="25" width="80" height="50" rx="10" fill="none" stroke="currentColor" stroke-width="1"  />` },
  "Square": { type: "rect", width: 200, height: 200, svgMarkup: `<rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" stroke-width="1"  />` },
  "Circle": { type: "ellipse", width: 200, height: 200, svgMarkup: `<circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="1"  />` },
  "Diamond": { type: "diamond", width: 200, height: 200, svgMarkup: `<polygon points="50,15 85,50 50,85 15,50" fill="none" stroke="currentColor" stroke-width="1"  />` },
  "Cloud": {
    type: "svg", width: 280, height: 180,
    svgMarkup: `<path d="M 35,60 A 15,15 0 0,1 45,40 A 25,25 0 0,1 85,45 A 20,20 0 0,1 80,75 L 35,75 A 10,10 0 0,1 35,60 Z" fill="none" stroke="currentColor" stroke-width="1"  />`
  },
  "Hexagon": {
    type: "svg", width: 240, height: 200,
    svgMarkup: `<polygon points="25,20 75,20 95,50 75,80 25,80 5,50" fill="none" stroke="currentColor" stroke-width="1"  />`
  },
  "Triangle": {
    type: "svg", width: 200, height: 200,
    svgMarkup: `<polygon points="50,20 85,80 15,80" fill="none" stroke="currentColor" stroke-width="1"  />`
  },
  "Trapezoid": {
    type: "svg", width: 240, height: 160,
    svgMarkup: `<polygon points="35,25 65,25 85,75 15,75" fill="none" stroke="currentColor" stroke-width="1"  />`
  },
  "Cylinder": {
    type: "svg", width: 160, height: 240,
    svgMarkup: `<path d="M 30,25 A 20,8 0 0,0 70,25 A 20,8 0 0,0 30,25 M 30,25 L 30,75 A 20,8 0 0,0 70,75 L 70,25" fill="none" stroke="currentColor" stroke-width="1"  />`
  },
  "Isometric Cube": {
    type: "svg", width: 200, height: 200,
    svgMarkup: `<path d="M 50,20 L 75,35 L 50,50 L 25,35 Z M 25,35 L 25,65 L 50,80 L 50,50 M 75,35 L 75,65 L 50,80" fill="none" stroke="currentColor" stroke-width="1"  stroke-linejoin="round" />`
  },

  // 2. Flowchart Shapes
  "Process": { type: "rect", width: 240, height: 160, svgMarkup: `<rect x="10" y="25" width="80" height="50" fill="none" stroke="currentColor" stroke-width="1"  /><line x1="20" y1="25" x2="20" y2="75" stroke="currentColor" stroke-width="1"  /><line x1="80" y1="25" x2="80" y2="75" stroke="currentColor" stroke-width="1"  />` },
  "Step": {
    type: "svg", width: 240, height: 160,
    svgMarkup: `<polygon points="10,25 70,25 85,50 70,75 10,75 25,50" fill="none" stroke="currentColor" stroke-width="1"  />`
  },
  "Document": {
    type: "svg", width: 240, height: 160,
    svgMarkup: `<path d="M 15,20 L 85,20 L 85,65 Q 60,85 45,65 Q 25,45 15,65 Z" fill="none" stroke="currentColor" stroke-width="1"  />`
  },
  "Internal Storage": {
    type: "svg", width: 200, height: 200,
    svgMarkup: `<rect x="15" y="15" width="70" height="70" fill="none" stroke="currentColor" stroke-width="1"  /><line x1="30" y1="15" x2="30" y2="85" stroke="currentColor" stroke-width="1"  /><line x1="15" y1="30" x2="85" y2="30" stroke="currentColor" stroke-width="1"  />`
  },
  "Card": {
    type: "svg", width: 160, height: 200,
    svgMarkup: `<polygon points="15,35 35,15 85,15 85,85 15,85" fill="none" stroke="currentColor" stroke-width="1"  />`
  },
  "Note": {
    type: "svg", width: 160, height: 200,
    svgMarkup: `<path d="M 25,20 L 65,20 L 80,35 L 80,80 L 25,80 Z M 65,20 L 65,35 L 80,35" fill="none" stroke="currentColor" stroke-width="1"  />`
  },
  "Or": {
    type: "svg", width: 160, height: 160,
    svgMarkup: `<path d="M 30,20 A 40,40 0 0,1 30,80 Q 15,50 30,20" fill="none" stroke="currentColor" stroke-width="1"  />`
  },
  "And": {
    type: "svg", width: 160, height: 160,
    svgMarkup: `<path d="M 30,20 L 30,80 A 30,30 0 0,0 30,20" fill="none" stroke="currentColor" stroke-width="1"  />`
  },

  // 3. Text & Annotation
  "Text": { type: "text", width: 240, height: 80, svgMarkup: `<text x="50" y="55" text-anchor="middle" font-size="20" font-family="sans-serif" fill="currentColor">Text</text>` },
  "Callout": {
    type: "svg", width: 240, height: 160,
    svgMarkup: `<path d="M 10,20 L 90,20 L 90,60 L 60,60 L 50,80 L 40,60 L 10,60 Z" fill="none" stroke="currentColor" stroke-width="1"  />`
  },
  
  // 5. Lines, Arrows
  "Line": { type: "line", width: 200, height: 200, svgMarkup: `<line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" stroke-width="1"  />` },
  "Arrow": { type: "arrow", width: 200, height: 200, svgMarkup: `<line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" stroke-width="1"  marker-end="url(#arrow)" />` },
  "Dashed Line": { type: "line", width: 200, height: 200, svgMarkup: `<line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" stroke-width="1"  stroke-dasharray="8 4" />` },

  // Default Fallback
  "default": { type: "svg", width: 240, height: 160, svgMarkup: `<rect x="15" y="25" width="70" height="50" fill="none" stroke="currentColor" stroke-width="1"  stroke-dasharray="4 4" /><text x="50" y="55" text-anchor="middle" font-size="12" fill="currentColor">complex</text>` }
};

export function getShapeDefinition(name: string): ShapeDefinition {
  return REGISTRY[name] ?? (REGISTRY["default"] as ShapeDefinition);
}
