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
  "Process": {
    type: "svg", width: 240, height: 160,
    svgMarkup: `<rect x="5" y="15" width="90" height="70" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><line x1="18" y1="15" x2="18" y2="85" stroke="currentColor" stroke-width="2" /><line x1="82" y1="15" x2="82" y2="85" stroke="currentColor" stroke-width="2" />`
  },
  "Step": {
    type: "svg", width: 240, height: 160,
    svgMarkup: `<polygon points="12,20 70,20 88,50 70,80 12,80 30,50" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />`
  },
  "Document": {
    type: "svg", width: 240, height: 160,
    svgMarkup: `<path d="M 10,20 L 90,20 L 90,70 Q 70,55 50,70 Q 30,85 10,70 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />`
  },
  "Internal Storage": {
    type: "svg", width: 200, height: 200,
    svgMarkup: `<rect x="10" y="10" width="80" height="80" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><line x1="26" y1="10" x2="26" y2="90" stroke="currentColor" stroke-width="2" /><line x1="10" y1="26" x2="90" y2="26" stroke="currentColor" stroke-width="2" />`
  },
  "Card": {
    type: "svg", width: 180, height: 220,
    svgMarkup: `<polygon points="26,15 88,15 88,85 12,85 12,29" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />`
  },
  "Note": {
    type: "svg", width: 180, height: 220,
    svgMarkup: `<path d="M 18,15 L 64,15 L 82,33 L 82,85 L 18,85 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /><path d="M 64,15 L 64,33 L 82,33" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />`
  },
  "Or": {
    type: "svg", width: 180, height: 180,
    svgMarkup: `<path d="M 24,18 Q 42,50 24,82 Q 80,72 80,50 Q 80,28 24,18 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />`
  },
  "And": {
    type: "svg", width: 180, height: 180,
    svgMarkup: `<path d="M 24,18 L 24,82 A 32,32 0 0,0 24,18 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />`
  },

  // 3. Text & Annotation
  "Text": { type: "text", width: 240, height: 80, svgMarkup: `<text x="50" y="55" text-anchor="middle" font-size="20" font-family="sans-serif" fill="currentColor">Text</text>` },
  "Callout": {
    type: "svg", width: 240, height: 160,
    svgMarkup: `<path d="M 10,20 L 90,20 L 90,60 L 60,60 L 50,80 L 40,60 L 10,60 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />`
  },

  // 4. Containers & Grouping
  "Container": {
    type: "svg", width: 360, height: 320, rx: 6,
    svgMarkup: `<rect x="8" y="8" width="84" height="84" rx="4" fill="none" stroke="currentColor" stroke-width="2" /><rect x="13" y="13" width="74" height="74" rx="2" fill="none" stroke="currentColor" stroke-width="1" stroke-opacity="0.6" />`
  },
  "Vertical Container": {
    type: "svg", width: 320, height: 400, rx: 6,
    svgMarkup: `<rect x="8" y="8" width="84" height="84" rx="4" fill="none" stroke="currentColor" stroke-width="2" /><line x1="8" y1="24" x2="92" y2="24" stroke="currentColor" stroke-width="1.8" /><text x="50" y="19" text-anchor="middle" font-size="7" font-family="sans-serif" font-weight="600" fill="currentColor">Vertical Container</text>`
  },
  "Horizontal Container": {
    type: "svg", width: 440, height: 300, rx: 6,
    svgMarkup: `<rect x="8" y="8" width="84" height="84" rx="4" fill="none" stroke="currentColor" stroke-width="2" /><line x1="22" y1="8" x2="22" y2="92" stroke="currentColor" stroke-width="1.8" /><text x="15" y="50" text-anchor="middle" font-size="6.5" font-family="sans-serif" font-weight="600" fill="currentColor" transform="rotate(-90 15 50)">Horizontal Container</text>`
  },

  // 5. Lines, Arrows
  "Line": { type: "line", width: 200, height: 200, svgMarkup: `<line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" stroke-width="2" />` },
  "Arrow": { type: "arrow", width: 200, height: 200, svgMarkup: `<line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" stroke-width="2" marker-end="url(#arrow)" />` },
  "Dashed Line": { type: "line", width: 200, height: 200, svgMarkup: `<line x1="20" y1="80" x2="80" y2="20" stroke="currentColor" stroke-width="2" stroke-dasharray="8 4" />` },

  // 9. UML - Structural Diagrams
  "Class": {
    type: "svg", width: 250, height: 180, rx: 4,
    svgMarkup: `<rect x="8" y="12" width="84" height="76" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><line x1="8" y1="34" x2="92" y2="34" stroke="currentColor" stroke-width="1.5" /><line x1="8" y1="56" x2="92" y2="56" stroke="currentColor" stroke-width="1.5" /><text x="50" y="27" text-anchor="middle" font-size="8" font-family="sans-serif" font-weight="bold" fill="currentColor">Classname</text><text x="13" y="47" font-size="6.5" font-family="monospace" fill="currentColor">+ field: type</text><text x="13" y="69" font-size="6.5" font-family="monospace" fill="currentColor">+ method(type): type</text>`
  },
  "Class 2": {
    type: "svg", width: 250, height: 180, rx: 4,
    svgMarkup: `<rect x="8" y="12" width="84" height="76" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><line x1="8" y1="34" x2="92" y2="34" stroke="currentColor" stroke-width="1.5" /><text x="50" y="27" text-anchor="middle" font-size="8" font-family="sans-serif" font-weight="bold" fill="currentColor">Classname</text><text x="13" y="46" font-size="6.5" font-family="monospace" fill="currentColor">+ field: type</text><text x="13" y="58" font-size="6.5" font-family="monospace" fill="currentColor">+ field: type</text><text x="13" y="70" font-size="6.5" font-family="monospace" fill="currentColor">+ field: type</text>`
  },
  "Interface": {
    type: "svg", width: 240, height: 150, rx: 4,
    svgMarkup: `<rect x="8" y="18" width="84" height="64" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><text x="50" y="43" text-anchor="middle" font-size="7" font-family="sans-serif" fill="currentColor">«interface»</text><text x="50" y="58" text-anchor="middle" font-size="9" font-family="sans-serif" font-weight="bold" fill="currentColor">Name</text>`
  },
  "Interface 2": {
    type: "svg", width: 260, height: 200, rx: 4,
    svgMarkup: `<rect x="8" y="10" width="84" height="80" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><line x1="8" y1="30" x2="92" y2="30" stroke="currentColor" stroke-width="1.5" /><line x1="8" y1="55" x2="92" y2="55" stroke="currentColor" stroke-width="1.5" /><text x="50" y="20" text-anchor="middle" font-size="6" font-family="sans-serif" fill="currentColor">«Interface»</text><text x="50" y="28" text-anchor="middle" font-size="7" font-family="sans-serif" font-weight="bold" fill="currentColor">Interface</text><text x="12" y="40" font-size="5.5" font-family="monospace" fill="currentColor">+ field1: Type</text><text x="12" y="48" font-size="5.5" font-family="monospace" fill="currentColor">+ field2: Type</text><text x="12" y="66" font-size="5.5" font-family="monospace" fill="currentColor">+ method1(Type): Type</text><text x="12" y="74" font-size="5.5" font-family="monospace" fill="currentColor">+ method2(Type, Type): Type</text>`
  },
  "Provided/Required Interface": {
    type: "svg", width: 140, height: 140,
    svgMarkup: `<circle cx="44" cy="50" r="14" fill="none" stroke="currentColor" stroke-width="2" /><path d="M 52,26 A 25,25 0 0,1 52,74" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />`
  },
  "Required Interface": {
    type: "svg", width: 120, height: 120,
    svgMarkup: `<path d="M 44,24 A 26,26 0 0,1 44,76" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />`
  },
  "Object": {
    type: "svg", width: 220, height: 140, rx: 4,
    svgMarkup: `<rect x="10" y="22" width="80" height="56" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><text x="50" y="54" text-anchor="middle" font-size="10" font-family="sans-serif" font-weight="bold" fill="currentColor">Object</text>`
  },
  "Object:Type": {
    type: "svg", width: 250, height: 180, rx: 4,
    svgMarkup: `<rect x="8" y="12" width="84" height="76" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><line x1="8" y1="34" x2="92" y2="34" stroke="currentColor" stroke-width="1.5" /><text x="50" y="27" text-anchor="middle" font-size="8" font-family="sans-serif" font-weight="bold" text-decoration="underline" fill="currentColor">Object:Type</text><text x="13" y="47" font-size="6.5" font-family="monospace" fill="currentColor">field1 = value1</text><text x="13" y="59" font-size="6.5" font-family="monospace" fill="currentColor">field2 = value2</text><text x="13" y="71" font-size="6.5" font-family="monospace" fill="currentColor">field3 = value3</text>`
  },
  "Entity": {
    type: "svg", width: 260, height: 190, rx: 4,
    svgMarkup: `<rect x="8" y="12" width="84" height="76" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><rect x="8" y="12" width="84" height="18" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-width="1.5" /><text x="14" y="25" font-size="8" font-family="sans-serif" font-weight="bold" fill="currentColor">Tablename</text><line x1="8" y1="30" x2="92" y2="30" stroke="currentColor" stroke-width="1.5" /><text x="13" y="44" font-size="6.5" font-family="monospace" font-weight="bold" fill="currentColor">PK</text><text x="34" y="44" font-size="6.5" font-family="monospace" fill="currentColor">uniqueId</text><text x="13" y="56" font-size="6.5" font-family="monospace" font-weight="bold" fill="currentColor">FK1</text><text x="34" y="56" font-size="6.5" font-family="monospace" fill="currentColor">foreignKey</text><text x="34" y="68" font-size="6.5" font-family="monospace" fill="currentColor">fieldname</text>`
  },
  "Component": {
    type: "svg", width: 250, height: 170, rx: 4,
    svgMarkup: `<rect x="8" y="15" width="84" height="70" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><rect x="76" y="20" width="11" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.2" /><rect x="73" y="22.5" width="4" height="3" fill="none" stroke="currentColor" stroke-width="1" /><rect x="73" y="28.5" width="4" height="3" fill="none" stroke="currentColor" stroke-width="1" /><text x="44" y="45" text-anchor="middle" font-size="7" font-family="sans-serif" fill="currentColor">«Annotation»</text><text x="44" y="58" text-anchor="middle" font-size="8.5" font-family="sans-serif" font-weight="bold" fill="currentColor">Component</text>`
  },
  "Component with Attributes": {
    type: "svg", width: 260, height: 180, rx: 4,
    svgMarkup: `<rect x="8" y="12" width="84" height="76" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><line x1="8" y1="32" x2="92" y2="32" stroke="currentColor" stroke-width="1.5" /><text x="42" y="25" text-anchor="middle" font-size="8" font-family="sans-serif" font-weight="bold" fill="currentColor">Component</text><rect x="76" y="16" width="11" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="1" /><rect x="73" y="18" width="4" height="2.5" fill="none" stroke="currentColor" stroke-width="0.8" /><rect x="73" y="23.5" width="4" height="2.5" fill="none" stroke="currentColor" stroke-width="0.8" /><text x="13" y="47" font-size="6.5" font-family="monospace" fill="currentColor">+ Attribute1: Type</text><text x="13" y="59" font-size="6.5" font-family="monospace" fill="currentColor">+ Attribute2: Type</text>`
  },
  "Module": {
    type: "svg", width: 240, height: 160, rx: 4,
    svgMarkup: `<rect x="18" y="16" width="74" height="68" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><rect x="10" y="28" width="16" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.8" /><rect x="10" y="52" width="16" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.8" /><text x="56" y="54" text-anchor="middle" font-size="9" font-family="sans-serif" font-weight="bold" fill="currentColor">Module</text>`
  },
  "Package": {
    type: "svg", width: 240, height: 180, rx: 4,
    svgMarkup: `<path d="M 12,30 L 12,18 L 44,18 L 48,30" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /><rect x="12" y="30" width="76" height="54" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><text x="50" y="60" text-anchor="middle" font-size="9.5" font-family="sans-serif" font-weight="bold" fill="currentColor">package</text>`
  },

  // 10. UML - Use Case Diagrams
  "Actor": {
    type: "svg", width: 160, height: 240,
    svgMarkup: `<circle cx="50" cy="20" r="12" fill="none" stroke="currentColor" stroke-width="2" /><line x1="50" y1="32" x2="50" y2="65" stroke="currentColor" stroke-width="2" /><line x1="20" y1="44" x2="80" y2="44" stroke="currentColor" stroke-width="2" /><line x1="50" y1="65" x2="25" y2="92" stroke="currentColor" stroke-width="2" /><line x1="50" y1="65" x2="75" y2="92" stroke="currentColor" stroke-width="2" />`
  },
  "Use Case": {
    type: "svg", width: 240, height: 150,
    svgMarkup: `<ellipse cx="50" cy="50" rx="42" ry="26" fill="none" stroke="currentColor" stroke-width="2" /><text x="50" y="54" text-anchor="middle" font-size="9" font-family="sans-serif" font-weight="500" fill="currentColor">Use Case</text>`
  },

  // 11. UML - Sequence Diagrams
  "Object (lifeline header)": {
    type: "svg", width: 220, height: 140, rx: 4,
    svgMarkup: `<rect x="10" y="22" width="80" height="56" rx="2" fill="none" stroke="currentColor" stroke-width="2" /><text x="50" y="54" text-anchor="middle" font-size="10" font-family="sans-serif" font-weight="bold" fill="currentColor">Object</text>`
  },
  "Lifeline": {
    type: "svg", width: 180, height: 320,
    svgMarkup: `<rect x="18" y="10" width="64" height="26" rx="2" fill="none" stroke="currentColor" stroke-width="1.8" /><text x="50" y="27" text-anchor="middle" font-size="8.5" font-family="sans-serif" font-weight="bold" fill="currentColor">Object</text><line x1="50" y1="36" x2="50" y2="95" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" />`
  },
  "Activation Bar": {
    type: "svg", width: 80, height: 260,
    svgMarkup: `<rect x="36" y="8" width="28" height="84" rx="1.5" fill="none" stroke="currentColor" stroke-width="2" />`
  },
  "Found Message": {
    type: "svg", width: 240, height: 200,
    svgMarkup: `<circle cx="18" cy="24" r="4" fill="currentColor" /><line x1="22" y1="24" x2="72" y2="24" stroke="currentColor" stroke-width="2" /><polygon points="70,20 78,24 70,28" fill="currentColor" stroke="currentColor" /><text x="46" y="17" text-anchor="middle" font-size="8" font-family="sans-serif" fill="currentColor">dispatch</text><rect x="78" y="16" width="10" height="68" rx="1" fill="none" stroke="currentColor" stroke-width="1.8" />`
  },
  "Found Message 1": {
    type: "svg", width: 220, height: 120,
    svgMarkup: `<circle cx="18" cy="52" r="4.5" fill="currentColor" /><line x1="22.5" y1="52" x2="72" y2="52" stroke="currentColor" stroke-width="2" /><polygon points="70,47 80,52 70,57" fill="currentColor" stroke="currentColor" /><text x="48" y="42" text-anchor="middle" font-size="8.5" font-family="sans-serif" fill="currentColor">dispatch</text>`
  },
  "Found Message (variant)": {
    type: "svg", width: 220, height: 120,
    svgMarkup: `<circle cx="18" cy="52" r="4.5" fill="currentColor" /><line x1="22.5" y1="52" x2="72" y2="52" stroke="currentColor" stroke-width="2" /><polygon points="70,47 80,52 70,57" fill="currentColor" stroke="currentColor" /><text x="48" y="42" text-anchor="middle" font-size="8.5" font-family="sans-serif" fill="currentColor">dispatch</text>`
  },
  "Synchronous Invocation": {
    type: "svg", width: 240, height: 220,
    svgMarkup: `<line x1="16" y1="28" x2="70" y2="28" stroke="currentColor" stroke-width="2" /><polygon points="68,24 76,28 68,32" fill="currentColor" stroke="currentColor" /><text x="45" y="21" text-anchor="middle" font-size="7.5" font-family="sans-serif" fill="currentColor">dispatch</text><rect x="76" y="20" width="10" height="65" rx="1" fill="none" stroke="currentColor" stroke-width="1.8" /><line x1="76" y1="75" x2="22" y2="75" stroke="currentColor" stroke-width="1.8" stroke-dasharray="3 3" /><polyline points="28,70 20,75 28,80" fill="none" stroke="currentColor" stroke-width="1.8" /><text x="45" y="69" text-anchor="middle" font-size="7.5" font-family="sans-serif" fill="currentColor">return</text>`
  },
  "Self Call": {
    type: "svg", width: 220, height: 220,
    svgMarkup: `<rect x="18" y="25" width="10" height="60" rx="1" fill="none" stroke="currentColor" stroke-width="1.8" /><polyline points="28,35 58,35 58,55 34,55" fill="none" stroke="currentColor" stroke-width="1.8" /><polygon points="36,51 28,55 36,59" fill="currentColor" stroke="currentColor" /><text x="62" y="48" font-size="7.5" font-family="sans-serif" fill="currentColor">self call</text>`
  },
  "Callback": {
    type: "svg", width: 240, height: 220,
    svgMarkup: `<rect x="18" y="16" width="10" height="68" rx="1" fill="none" stroke="currentColor" stroke-width="1.8" /><line x1="28" y1="26" x2="82" y2="26" stroke="currentColor" stroke-width="1.8" /><polyline points="36,22 28,26 36,30" fill="none" stroke="currentColor" stroke-width="1.8" /><text x="56" y="20" text-anchor="middle" font-size="7.5" font-family="sans-serif" fill="currentColor">callback</text><line x1="28" y1="74" x2="80" y2="74" stroke="currentColor" stroke-width="1.8" stroke-dasharray="3 3" /><polygon points="78,70 86,74 78,78" fill="currentColor" stroke="currentColor" /><text x="56" y="68" text-anchor="middle" font-size="7.5" font-family="sans-serif" fill="currentColor">return</text>`
  },
  "Return": {
    type: "svg", width: 220, height: 120,
    svgMarkup: `<line x1="82" y1="56" x2="26" y2="56" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3" /><polyline points="34,49 24,56 34,63" fill="none" stroke="currentColor" stroke-width="2" /><text x="54" y="44" text-anchor="middle" font-size="9" font-family="sans-serif" fill="currentColor">return</text>`
  },
  "Destruction": {
    type: "svg", width: 140, height: 140,
    svgMarkup: `<line x1="22" y1="22" x2="78" y2="78" stroke="currentColor" stroke-width="5" stroke-linecap="round" /><line x1="78" y1="22" x2="22" y2="78" stroke="currentColor" stroke-width="5" stroke-linecap="round" />`
  },

  // 12. UML - State / Activity Diagrams
  "Start": {
    type: "svg", width: 140, height: 180,
    svgMarkup: `<circle cx="50" cy="28" r="14" fill="currentColor" /><line x1="50" y1="42" x2="50" y2="82" stroke="currentColor" stroke-width="2" /><polyline points="44,74 50,82 56,74" fill="none" stroke="currentColor" stroke-width="2" />`
  },
  "End": {
    type: "svg", width: 150, height: 150,
    svgMarkup: `<circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="2" /><circle cx="50" cy="50" r="18" fill="currentColor" />`
  },
  "Activity": {
    type: "svg", width: 220, height: 180,
    svgMarkup: `<rect x="15" y="16" width="70" height="34" rx="17" fill="none" stroke="currentColor" stroke-width="2" /><text x="50" y="37" text-anchor="middle" font-size="8.5" font-family="sans-serif" font-weight="500" fill="currentColor">Activity</text><line x1="50" y1="50" x2="50" y2="84" stroke="currentColor" stroke-width="2" /><polyline points="44,76 50,84 56,76" fill="none" stroke="currentColor" stroke-width="2" />`
  },
  "Composite State": {
    type: "svg", width: 240, height: 200,
    svgMarkup: `<rect x="10" y="14" width="80" height="48" rx="8" fill="none" stroke="currentColor" stroke-width="2" /><line x1="10" y1="36" x2="90" y2="36" stroke="currentColor" stroke-width="1.5" /><text x="50" y="28" text-anchor="middle" font-size="7.5" font-family="sans-serif" font-weight="bold" fill="currentColor">Composite State</text><text x="50" y="49" text-anchor="middle" font-size="7" font-family="sans-serif" fill="currentColor">Subtitle</text><line x1="50" y1="62" x2="50" y2="88" stroke="currentColor" stroke-width="2" /><polyline points="44,80 50,88 56,80" fill="none" stroke="currentColor" stroke-width="2" />`
  },
  "Condition": {
    type: "svg", width: 240, height: 200,
    svgMarkup: `<polygon points="40,20 66,38 40,56 14,38" fill="none" stroke="currentColor" stroke-width="2" /><text x="40" y="41" text-anchor="middle" font-size="6.5" font-family="sans-serif" font-weight="500" fill="currentColor">Condition</text><line x1="66" y1="38" x2="92" y2="38" stroke="currentColor" stroke-width="1.8" /><polyline points="86,34 92,38 86,42" fill="none" stroke="currentColor" stroke-width="1.8" /><text x="76" y="32" font-size="7" font-family="sans-serif" fill="currentColor">no</text><line x1="40" y1="56" x2="40" y2="88" stroke="currentColor" stroke-width="1.8" /><polyline points="36,82 40,88 44,82" fill="none" stroke="currentColor" stroke-width="1.8" /><text x="44" y="70" font-size="7" font-family="sans-serif" fill="currentColor">yes</text>`
  },
  "Fork/Join": {
    type: "svg", width: 240, height: 150,
    svgMarkup: `<rect x="12" y="26" width="76" height="6" rx="2" fill="currentColor" stroke="currentColor" stroke-width="1" /><line x1="50" y1="32" x2="50" y2="76" stroke="currentColor" stroke-width="2" /><polyline points="44,68 50,76 56,68" fill="none" stroke="currentColor" stroke-width="2" />`
  },

  // 13. UML - Relationships (Connectors)
  "Association 1": {
    type: "svg", width: 240, height: 100,
    svgMarkup: `<line x1="12" y1="55" x2="88" y2="55" stroke="currentColor" stroke-width="2" /><text x="14" y="44" font-size="7.5" font-family="sans-serif" fill="currentColor">parent</text><text x="86" y="44" text-anchor="end" font-size="7.5" font-family="sans-serif" fill="currentColor">child</text>`
  },
  "Relation 1": {
    type: "svg", width: 240, height: 100,
    svgMarkup: `<line x1="12" y1="52" x2="82" y2="52" stroke="currentColor" stroke-width="2" /><polyline points="75,46 84,52 75,58" fill="none" stroke="currentColor" stroke-width="2" /><text x="14" y="40" font-size="7.5" font-family="sans-serif" fill="currentColor">1</text><text x="14" y="68" font-size="7.5" font-family="sans-serif" fill="currentColor">name</text>`
  },
  "Relation 2": {
    type: "svg", width: 260, height: 100,
    svgMarkup: `<polygon points="12,50 19,45 26,50 19,55" fill="none" stroke="currentColor" stroke-width="1.8" /><line x1="26" y1="50" x2="82" y2="50" stroke="currentColor" stroke-width="1.8" /><polyline points="75,44 84,50 75,56" fill="none" stroke="currentColor" stroke-width="1.8" /><text x="19" y="67" text-anchor="middle" font-size="7" font-family="sans-serif" fill="currentColor">0..n</text><text x="54" y="42" text-anchor="middle" font-size="7.5" font-family="sans-serif" fill="currentColor">Relation</text><text x="82" y="67" text-anchor="middle" font-size="7" font-family="sans-serif" fill="currentColor">1</text>`
  },
  "Aggregation 1": {
    type: "svg", width: 240, height: 100,
    svgMarkup: `<polygon points="12,50 20,44 28,50 20,56" fill="none" stroke="currentColor" stroke-width="1.8" /><line x1="28" y1="50" x2="82" y2="50" stroke="currentColor" stroke-width="1.8" /><polyline points="75,44 84,50 75,56" fill="none" stroke="currentColor" stroke-width="1.8" /><text x="16" y="36" font-size="7.5" font-family="sans-serif" fill="currentColor">1</text>`
  },
  "Composition 1": {
    type: "svg", width: 240, height: 100,
    svgMarkup: `<polygon points="12,50 20,44 28,50 20,56" fill="currentColor" stroke="currentColor" stroke-width="1.8" /><line x1="28" y1="50" x2="82" y2="50" stroke="currentColor" stroke-width="1.8" /><polyline points="75,44 84,50 75,56" fill="none" stroke="currentColor" stroke-width="1.8" /><text x="16" y="36" font-size="7.5" font-family="sans-serif" fill="currentColor">1</text>`
  },
  "Dependency": {
    type: "svg", width: 240, height: 100,
    svgMarkup: `<line x1="10" y1="50" x2="42" y2="50" stroke="currentColor" stroke-width="1.8" stroke-dasharray="3 3" /><text x="50" y="53" text-anchor="middle" font-size="7.5" font-family="sans-serif" fill="currentColor">Use</text><line x1="58" y1="50" x2="82" y2="50" stroke="currentColor" stroke-width="1.8" stroke-dasharray="3 3" /><polyline points="75,44 84,50 75,56" fill="none" stroke="currentColor" stroke-width="1.8" />`
  },
  "Generalization": {
    type: "svg", width: 240, height: 100,
    svgMarkup: `<line x1="12" y1="50" x2="74" y2="50" stroke="currentColor" stroke-width="2" /><text x="44" y="41" text-anchor="middle" font-size="7.5" font-family="sans-serif" fill="currentColor">Extends</text><polygon points="74,42 86,50 74,58" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />`
  },
  "Implementation": {
    type: "svg", width: 240, height: 100,
    svgMarkup: `<line x1="12" y1="50" x2="74" y2="50" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3" /><polygon points="74,42 86,50 74,58" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />`
  },

  // Default Fallback
  "default": { type: "svg", width: 240, height: 160, svgMarkup: `<rect x="15" y="25" width="70" height="50" fill="none" stroke="currentColor" stroke-width="1"  stroke-dasharray="4 4" /><text x="50" y="55" text-anchor="middle" font-size="12" fill="currentColor">complex</text>` }
};

export function getShapeDefinition(name: string): ShapeDefinition {
  return REGISTRY[name] ?? (REGISTRY["default"] as ShapeDefinition);
}
