import { getDb, newId, now } from "../persistence/db";
import type { CommentRecord } from "../lib/types";

export class CommentThread {
  static list(boardId: string): CommentRecord[] {
    const rows = getDb()
      .prepare(
        `SELECT c.id, c.board_id, c.element_id, c.parent_id, c.user_id, u.name AS author_name,
                c.content, c.resolved, c.created_at
         FROM comments c JOIN users u ON u.id = c.user_id
         WHERE c.board_id = ?
         ORDER BY c.created_at ASC`,
      )
      .all(boardId) as Array<{
      id: string;
      board_id: string;
      element_id: string | null;
      parent_id: string | null;
      user_id: string;
      author_name: string;
      content: string;
      resolved: number;
      created_at: number;
    }>;
    return rows.map((row) => ({
      id: row.id,
      boardId: row.board_id,
      elementId: row.element_id,
      parentId: row.parent_id,
      userId: row.user_id,
      authorName: row.author_name,
      content: row.content,
      resolved: Boolean(row.resolved),
      createdAt: row.created_at,
    }));
  }

  static add(input: {
    boardId: string;
    userId: string;
    content: string;
    elementId?: string | null;
    parentId?: string | null;
  }): CommentRecord {
    const content = input.content.trim();
    if (!content) throw new Error("Comment cannot be empty.");
    const id = newId();
    const createdAt = now();
    getDb()
      .prepare(
        `INSERT INTO comments (id, board_id, element_id, parent_id, user_id, content, resolved, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      )
      .run(
        id,
        input.boardId,
        input.elementId ?? null,
        input.parentId ?? null,
        input.userId,
        content,
        createdAt,
      );
    const created = CommentThread.list(input.boardId).find((item) => item.id === id);
    if (!created) throw new Error("Comment could not be saved.");
    return created;
  }

  static resolve(boardId: string, commentId: string): void {
    getDb()
      .prepare("UPDATE comments SET resolved = 1 WHERE board_id = ? AND id = ?")
      .run(boardId, commentId);
  }
}
