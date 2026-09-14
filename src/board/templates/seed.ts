import type { DatabaseSync } from "node:sqlite";
import type { DiagramElementRecord, TemplateKind } from "../../lib/types";

const BOX = {
  fill: "#ffffff",
  stroke: "#151b31",
};

function el(
  partial: Omit<DiagramElementRecord, "boardId" | "updatedAt" | "rotation" | "fromId" | "toId" | "textAlign"> &
    Partial<Pick<DiagramElementRecord, "fromId" | "toId" | "textAlign">>,
): DiagramElementRecord {
  return {
    boardId: "template",
    rotation: 0,
    textAlign: "left",
    fromId: null,
    toId: null,
    updatedAt: 0,
    ...partial,
  };
}

function uml(): DiagramElementRecord[] {
  return [
    el({ id: "uml-user", type: "rect", x: 80, y: 80, width: 200, height: 140, fill: "#ffffff", stroke: "#151b31", text: "User\n+ email\n+ authenticate()", zIndex: 1 }),
    el({ id: "uml-board", type: "rect", x: 360, y: 80, width: 220, height: 140, fill: "#ffffff", stroke: "#151b31", text: "Board\n+ title\n+ create() / archive()", zIndex: 2 }),
    el({ id: "uml-link", type: "connector", x: 280, y: 150, width: 80, height: 0, ...BOX, text: "owns", fromId: "uml-user", toId: "uml-board", zIndex: 3 }),
    el({ id: "uml-member", type: "rect", x: 220, y: 300, width: 220, height: 120, fill: "#fedf89", stroke: "#151b31", text: "BoardMember\nrole: Owner | Editor", zIndex: 4 }),
  ];
}

function flowchart(): DiagramElementRecord[] {
  return [
    el({ id: "fc-start", type: "ellipse", x: 280, y: 40, width: 180, height: 72, fill: "#86e0c1", stroke: "#151b31", text: "Start", zIndex: 1 }),
    el({ id: "fc-edit", type: "rect", x: 270, y: 160, width: 200, height: 80, fill: "#ffffff", stroke: "#151b31", text: "Perform edit", zIndex: 2 }),
    el({ id: "fc-check", type: "diamond", x: 250, y: 290, width: 240, height: 140, fill: "#ffffff", stroke: "#151b31", text: "Allowed?", zIndex: 3 }),
    el({ id: "fc-apply", type: "rect", x: 520, y: 320, width: 180, height: 80, fill: "#86e0c1", stroke: "#151b31", text: "Apply + broadcast", zIndex: 4 }),
    el({ id: "fc-reject", type: "rect", x: 40, y: 320, width: 180, height: 80, fill: "#ff5858", stroke: "#151b31", text: "Reject", zIndex: 5 }),
    el({ id: "fc-a", type: "connector", x: 0, y: 0, width: 0, height: 0, ...BOX, text: "", fromId: "fc-start", toId: "fc-edit", zIndex: 6 }),
    el({ id: "fc-b", type: "connector", x: 0, y: 0, width: 0, height: 0, ...BOX, text: "", fromId: "fc-edit", toId: "fc-check", zIndex: 7 }),
    el({ id: "fc-c", type: "connector", x: 0, y: 0, width: 0, height: 0, ...BOX, text: "yes", fromId: "fc-check", toId: "fc-apply", zIndex: 8 }),
    el({ id: "fc-d", type: "connector", x: 0, y: 0, width: 0, height: 0, ...BOX, text: "no", fromId: "fc-check", toId: "fc-reject", zIndex: 9 }),
  ];
}

function er(): DiagramElementRecord[] {
  return [
    el({ id: "er-user", type: "rect", x: 60, y: 80, width: 200, height: 120, fill: "#ffffff", stroke: "#151b31", text: "USER\nuser_id\nemail", zIndex: 1 }),
    el({ id: "er-rel", type: "diamond", x: 300, y: 80, width: 160, height: 120, fill: "#fedf89", stroke: "#151b31", text: "member", zIndex: 2 }),
    el({ id: "er-board", type: "rect", x: 500, y: 80, width: 200, height: 120, fill: "#ffffff", stroke: "#151b31", text: "BOARD\nboard_id\ntitle", zIndex: 3 }),
    el({ id: "er-a", type: "connector", x: 0, y: 0, width: 0, height: 0, ...BOX, text: "", fromId: "er-user", toId: "er-rel", zIndex: 4 }),
    el({ id: "er-b", type: "connector", x: 0, y: 0, width: 0, height: 0, ...BOX, text: "", fromId: "er-rel", toId: "er-board", zIndex: 5 }),
  ];
}

function architecture(): DiagramElementRecord[] {
  return [
    el({ id: "ar-client", type: "rect", x: 240, y: 40, width: 240, height: 80, fill: "#ffffff", stroke: "#151b31", text: "Locus Web Client", zIndex: 1 }),
    el({ id: "ar-app", type: "rect", x: 80, y: 200, width: 220, height: 100, fill: "#151b31", stroke: "#151b31", text: "Application Layer\nHTTPS + JSON", zIndex: 2 }),
    el({ id: "ar-collab", type: "rect", x: 420, y: 200, width: 240, height: 100, fill: "#86e0c1", stroke: "#151b31", text: "Collaboration Layer\nWSS", zIndex: 3 }),
    el({ id: "ar-db", type: "rect", x: 80, y: 360, width: 220, height: 80, fill: "#fedf89", stroke: "#151b31", text: "Relational DB", zIndex: 4 }),
    el({ id: "ar-files", type: "rect", x: 420, y: 360, width: 240, height: 80, fill: "#ffffff", stroke: "#151b31", text: "File / object storage", zIndex: 5 }),
    el({ id: "ar-1", type: "connector", x: 0, y: 0, width: 0, height: 0, ...BOX, text: "HTTPS", fromId: "ar-client", toId: "ar-app", zIndex: 6 }),
    el({ id: "ar-2", type: "connector", x: 0, y: 0, width: 0, height: 0, ...BOX, text: "WSS", fromId: "ar-client", toId: "ar-collab", zIndex: 7 }),
    el({ id: "ar-3", type: "connector", x: 0, y: 0, width: 0, height: 0, ...BOX, text: "", fromId: "ar-app", toId: "ar-db", zIndex: 8 }),
    el({ id: "ar-4", type: "connector", x: 0, y: 0, width: 0, height: 0, ...BOX, text: "", fromId: "ar-collab", toId: "ar-files", zIndex: 9 }),
  ];
}

export const TEMPLATE_BUILDERS: Record<TemplateKind, () => DiagramElementRecord[]> = {
  uml,
  flowchart,
  er,
  architecture,
};

const SEED: Array<{ id: string; name: string; kind: TemplateKind; description: string }> = [
  { id: "tmpl-uml", name: "UML class", kind: "uml", description: "Classes, attributes, and relationships for object design." },
  { id: "tmpl-flow", name: "Flowchart", kind: "flowchart", description: "Start, process, decision, and outcome for a workflow." },
  { id: "tmpl-er", name: "ER diagram", kind: "er", description: "Entities and relationships for data modelling." },
  { id: "tmpl-arch", name: "Architecture", kind: "architecture", description: "Client, application, collaboration, and persistence layers." },
];

export function seedTemplates(db: DatabaseSync): void {
  const count = db.prepare("SELECT COUNT(*) AS n FROM templates").get() as { n: number };
  if (count.n > 0) return;
  const insert = db.prepare(
    "INSERT INTO templates (id, name, kind, description, snapshot) VALUES (?, ?, ?, ?, ?)",
  );
  for (const item of SEED) {
    insert.run(item.id, item.name, item.kind, item.description, JSON.stringify(TEMPLATE_BUILDERS[item.kind]()));
  }
}
