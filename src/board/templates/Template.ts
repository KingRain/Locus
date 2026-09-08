import type { DiagramElementRecord, TemplateKind, TemplateRecord } from "../../lib/types";
import { getDb } from "../../persistence/db";

type TemplateRow = {
  id: string;
  name: string;
  kind: TemplateKind;
  description: string;
  snapshot: string;
};

export class Template {
  constructor(
    public readonly record: TemplateRecord,
    private readonly snapshot: string,
  ) {}

  static list(): TemplateRecord[] {
    const rows = getDb()
      .prepare("SELECT id, name, kind, description FROM templates ORDER BY name")
      .all() as Omit<TemplateRow, "snapshot">[];
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      kind: row.kind,
      description: row.description,
    }));
  }

  static byKind(kind: TemplateKind): Template | null {
    const row = getDb()
      .prepare("SELECT id, name, kind, description, snapshot FROM templates WHERE kind = ?")
      .get(kind) as TemplateRow | undefined;
    if (!row) return null;
    return new Template(
      { id: row.id, name: row.name, kind: row.kind, description: row.description },
      row.snapshot,
    );
  }

  elements(boardId: string): DiagramElementRecord[] {
    const parsed = JSON.parse(this.snapshot) as DiagramElementRecord[];
    const idMap = new Map<string, string>();
    for (const element of parsed) {
      idMap.set(element.id, crypto.randomUUID());
    }
    return parsed.map((element) => ({
      ...element,
      id: idMap.get(element.id) ?? crypto.randomUUID(),
      boardId,
      fromId: element.fromId ? (idMap.get(element.fromId) ?? null) : null,
      toId: element.toId ? (idMap.get(element.toId) ?? null) : null,
    }));
  }
}
