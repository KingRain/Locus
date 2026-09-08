import { getDb, newId, now } from "../persistence/db";
import { User } from "../auth/User";
import { permissionChecker } from "./PermissionChecker";
import type { BoardMemberRecord, BoardRole, InvitationRecord } from "../lib/types";

export class BoardMember {
  static list(boardId: string): BoardMemberRecord[] {
    const rows = getDb()
      .prepare(
        `SELECT m.board_id, m.user_id, m.role, u.email, u.name
         FROM board_members m JOIN users u ON u.id = m.user_id
         WHERE m.board_id = ?`,
      )
      .all(boardId) as Array<{
      board_id: string;
      user_id: string;
      role: BoardRole;
      email: string;
      name: string;
    }>;
    return rows.map((row) => ({
      boardId: row.board_id,
      userId: row.user_id,
      role: row.role,
      email: row.email,
      name: row.name,
    }));
  }

  static assignRole(boardId: string, userId: string, role: BoardRole): void {
    getDb()
      .prepare(
        `INSERT INTO board_members (board_id, user_id, role) VALUES (?, ?, ?)
         ON CONFLICT(board_id, user_id) DO UPDATE SET role = excluded.role`,
      )
      .run(boardId, userId, role);
  }

  static revokeAccess(boardId: string, userId: string): void {
    getDb()
      .prepare("DELETE FROM board_members WHERE board_id = ? AND user_id = ?")
      .run(boardId, userId);
  }
}

export class Invitation {
  static list(boardId: string): InvitationRecord[] {
    const rows = getDb()
      .prepare(
        "SELECT id, board_id, email, role, status, created_at FROM invitations WHERE board_id = ? ORDER BY created_at DESC",
      )
      .all(boardId) as Array<{
      id: string;
      board_id: string;
      email: string;
      role: BoardRole;
      status: InvitationRecord["status"];
      created_at: number;
    }>;
    return rows.map((row) => ({
      id: row.id,
      boardId: row.board_id,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  static create(boardId: string, email: string, role: BoardRole): InvitationRecord {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@") || role === "owner") {
      throw new Error("Invalid invitation.");
    }
    const existing = User.findByEmail(normalized);
    if (existing && permissionChecker.canView(boardId, existing.record.id)) {
      throw new Error("That person already has access.");
    }
    if (existing) {
      BoardMember.assignRole(boardId, existing.record.id, role);
    }
    const record: InvitationRecord = {
      id: newId(),
      boardId,
      email: normalized,
      role,
      status: existing ? "accepted" : "pending",
      createdAt: now(),
    };
    getDb()
      .prepare(
        "INSERT INTO invitations (id, board_id, email, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(record.id, record.boardId, record.email, record.role, record.status, record.createdAt);
    return record;
  }

  static revoke(id: string, boardId: string): void {
    getDb()
      .prepare("UPDATE invitations SET status = 'revoked' WHERE id = ? AND board_id = ?")
      .run(id, boardId);
  }
}
