import { getDb } from "../persistence/db";
import type { BoardRole } from "../lib/types";

const ROLE_RANK: Record<BoardRole, number> = {
  viewer: 1,
  commenter: 2,
  editor: 3,
  owner: 4,
};

export class PermissionChecker {
  roleFor(boardId: string, userId: string): BoardRole | null {
    const row = getDb()
      .prepare("SELECT role FROM board_members WHERE board_id = ? AND user_id = ?")
      .get(boardId, userId) as { role: BoardRole } | undefined;
    return row?.role ?? null;
  }

  private atLeast(boardId: string, userId: string, min: BoardRole): boolean {
    const role = this.roleFor(boardId, userId);
    if (!role) return false;
    return ROLE_RANK[role] >= ROLE_RANK[min];
  }

  canView(boardId: string, userId: string): boolean {
    return this.atLeast(boardId, userId, "viewer");
  }

  canComment(boardId: string, userId: string): boolean {
    return this.atLeast(boardId, userId, "commenter");
  }

  canEdit(boardId: string, userId: string): boolean {
    return this.atLeast(boardId, userId, "editor");
  }

  canManage(boardId: string, userId: string): boolean {
    return this.atLeast(boardId, userId, "owner");
  }
}

export const permissionChecker = new PermissionChecker();
