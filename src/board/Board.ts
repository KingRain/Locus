import { getDb, newId, now } from "../persistence/db";
import { BoardMember } from "../sharing/Invitation";
import { permissionChecker } from "../sharing/PermissionChecker";
import type { BoardRecord, BoardStatus, TemplateKind } from "../lib/types";
import { Template } from "./templates/Template";
import { DiagramElement } from "./diagram/DiagramElement";
import { VersionManager } from "../history/VersionManager";

function mapBoard(row: {
  id: string;
  owner_id: string;
  title: string;
  status: BoardStatus;
  created_at: number;
  updated_at: number;
}): BoardRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class Board {
  constructor(public readonly record: BoardRecord) {}

  static get(id: string): Board | null {
    const row = getDb()
      .prepare(
        "SELECT id, owner_id, title, status, created_at, updated_at FROM boards WHERE id = ?",
      )
      .get(id) as
      | {
          id: string;
          owner_id: string;
          title: string;
          status: BoardStatus;
          created_at: number;
          updated_at: number;
        }
      | undefined;
    return row ? new Board(mapBoard(row)) : null;
  }

  rename(title: string): Board {
    const next = title.trim();
    if (!next) throw new Error("Board name is required.");
    const updatedAt = now();
    getDb()
      .prepare("UPDATE boards SET title = ?, updated_at = ? WHERE id = ?")
      .run(next, updatedAt, this.record.id);
    return new Board({ ...this.record, title: next, updatedAt });
  }

  archive(): Board {
    const updatedAt = now();
    getDb()
      .prepare("UPDATE boards SET status = 'archived', updated_at = ? WHERE id = ?")
      .run(updatedAt, this.record.id);
    return new Board({ ...this.record, status: "archived", updatedAt });
  }

  restore(): Board {
    const updatedAt = now();
    getDb()
      .prepare("UPDATE boards SET status = 'active', updated_at = ? WHERE id = ?")
      .run(updatedAt, this.record.id);
    return new Board({ ...this.record, status: "active", updatedAt });
  }

  delete(): void {
    getDb().prepare("DELETE FROM boards WHERE id = ?").run(this.record.id);
  }

  touch(): void {
    getDb()
      .prepare("UPDATE boards SET updated_at = ? WHERE id = ?")
      .run(now(), this.record.id);
  }
}

export class BoardManager {
  create(ownerId: string, title: string, templateKind?: TemplateKind): Board {
    const name = title.trim() || "Untitled board";
    const id = newId();
    const createdAt = now();
    getDb()
      .prepare(
        "INSERT INTO boards (id, owner_id, title, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?)",
      )
      .run(id, ownerId, name, createdAt, createdAt);
    BoardMember.assignRole(id, ownerId, "owner");
    if (templateKind) {
      const template = Template.byKind(templateKind);
      if (template) DiagramElement.applySnapshot(id, template.elements(id));
    }
    const board = Board.get(id);
    if (!board) throw new Error("Board could not be created.");
    VersionManager.capture(id, ownerId, "Created");
    return board;
  }

  listForUser(userId: string, query: string, status: BoardStatus): BoardRecord[] {
    const like = `%${query.trim().toLowerCase()}%`;
    const rows = getDb()
      .prepare(
        `SELECT b.id, b.owner_id, b.title, b.status, b.created_at, b.updated_at
         FROM boards b
         JOIN board_members m ON m.board_id = b.id
         WHERE m.user_id = ? AND b.status = ? AND lower(b.title) LIKE ?
         ORDER BY b.updated_at DESC`,
      )
      .all(userId, status, like) as Array<{
      id: string;
      owner_id: string;
      title: string;
      status: BoardStatus;
      created_at: number;
      updated_at: number;
    }>;
    return rows.map(mapBoard);
  }

  require(boardId: string): Board {
    const board = Board.get(boardId);
    if (!board) throw new Error("Board not found");
    return board;
  }

  requireView(boardId: string, userId: string): Board {
    const board = this.require(boardId);
    if (!permissionChecker.canView(boardId, userId)) {
      throw new Error("You do not have access to this board.");
    }
    return board;
  }
}

export const boardManager = new BoardManager();
