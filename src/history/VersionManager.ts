import { getDb, newId, now } from "../persistence/db";
import { DiagramElement } from "../board/diagram/DiagramElement";
import type { DiagramElementRecord, VersionRecord } from "../lib/types";

export class VersionManager {
  static list(boardId: string): VersionRecord[] {
    const rows = getDb()
      .prepare(
        `SELECT v.id, v.board_id, v.label, v.created_by, u.name AS author_name, v.created_at
         FROM versions v JOIN users u ON u.id = v.created_by
         WHERE v.board_id = ?
         ORDER BY v.created_at DESC`,
      )
      .all(boardId) as Array<{
      id: string;
      board_id: string;
      label: string;
      created_by: string;
      author_name: string;
      created_at: number;
    }>;
    return rows.map((row) => ({
      id: row.id,
      boardId: row.board_id,
      label: row.label,
      createdBy: row.created_by,
      authorName: row.author_name,
      createdAt: row.created_at,
    }));
  }

  static capture(boardId: string, userId: string, label: string): VersionRecord {
    const id = newId();
    const createdAt = now();
    getDb()
      .prepare(
        "INSERT INTO versions (id, board_id, label, snapshot, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(id, boardId, label, DiagramElement.snapshot(boardId), userId, createdAt);
    return {
      id,
      boardId,
      label,
      createdBy: userId,
      authorName: "",
      createdAt,
    };
  }

  static preview(boardId: string, versionId: string): DiagramElementRecord[] {
    const row = getDb()
      .prepare("SELECT snapshot FROM versions WHERE id = ? AND board_id = ?")
      .get(versionId, boardId) as { snapshot: string } | undefined;
    if (!row) throw new Error("Version not found");
    return JSON.parse(row.snapshot) as DiagramElementRecord[];
  }

  static restore(boardId: string, versionId: string, userId: string): void {
    const elements = VersionManager.preview(boardId, versionId);
    DiagramElement.replaceAll(boardId, elements);
    VersionManager.capture(boardId, userId, "Restored version");
  }
}
