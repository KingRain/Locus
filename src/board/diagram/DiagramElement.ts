import { getDb, now } from "../../persistence/db";
import type { DiagramElementRecord, ElementType } from "../../lib/types";

type ElementRow = {
  id: string;
  board_id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  text: string;
  from_id: string | null;
  to_id: string | null;
  z_index: number;
  updated_at: number;
};

function mapElement(row: ElementRow): DiagramElementRecord {
  return {
    id: row.id,
    boardId: row.board_id,
    type: row.type,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    rotation: row.rotation,
    fill: row.fill,
    stroke: row.stroke,
    text: row.text,
    fromId: row.from_id,
    toId: row.to_id,
    zIndex: row.z_index,
    updatedAt: row.updated_at,
  };
}

export class DiagramElement {
  static list(boardId: string): DiagramElementRecord[] {
    const rows = getDb()
      .prepare(
        `SELECT id, board_id, type, x, y, width, height, rotation, fill, stroke, text, from_id, to_id, z_index, updated_at
         FROM diagram_elements WHERE board_id = ? ORDER BY z_index ASC`,
      )
      .all(boardId) as ElementRow[];
    return rows.map(mapElement);
  }

  static upsert(element: DiagramElementRecord): DiagramElementRecord {
    const updated = { ...element, updatedAt: now() };
    getDb()
      .prepare(
        `INSERT INTO diagram_elements (
           id, board_id, type, x, y, width, height, rotation, fill, stroke, text, from_id, to_id, z_index, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           type=excluded.type, x=excluded.x, y=excluded.y, width=excluded.width, height=excluded.height,
           rotation=excluded.rotation, fill=excluded.fill, stroke=excluded.stroke, text=excluded.text,
           from_id=excluded.from_id, to_id=excluded.to_id, z_index=excluded.z_index, updated_at=excluded.updated_at`,
      )
      .run(
        updated.id,
        updated.boardId,
        updated.type,
        updated.x,
        updated.y,
        updated.width,
        updated.height,
        updated.rotation,
        updated.fill,
        updated.stroke,
        updated.text,
        updated.fromId,
        updated.toId,
        updated.zIndex,
        updated.updatedAt,
      );
    return updated;
  }

  static delete(boardId: string, elementId: string): void {
    getDb()
      .prepare("DELETE FROM diagram_elements WHERE board_id = ? AND id = ?")
      .run(boardId, elementId);
  }

  static replaceAll(boardId: string, elements: DiagramElementRecord[]): void {
    const db = getDb();
    db.exec("BEGIN");
    try {
      db.prepare("DELETE FROM diagram_elements WHERE board_id = ?").run(boardId);
      for (const element of elements) {
        DiagramElement.upsert({ ...element, boardId });
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  static applySnapshot(boardId: string, elements: DiagramElementRecord[]): void {
    DiagramElement.replaceAll(boardId, elements);
  }

  static snapshot(boardId: string): string {
    return JSON.stringify(DiagramElement.list(boardId));
  }
}
