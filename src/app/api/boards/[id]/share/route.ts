import { NextResponse } from "next/server";
import { boardManager } from "@/board/Board";
import { BoardMember, Invitation } from "@/sharing/Invitation";
import { permissionChecker } from "@/sharing/PermissionChecker";
import { jsonError, requireUser } from "@/lib/http";
import type { BoardRole } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    boardManager.requireView(id, user.record.id);
    return NextResponse.json({
      members: BoardMember.list(id),
      invitations: Invitation.list(id),
      role: permissionChecker.roleFor(id, user.record.id),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    if (!permissionChecker.canManage(id, user.record.id)) {
      throw new Error("You cannot manage sharing for this board.");
    }
    const body = (await request.json()) as {
      email?: string;
      role?: BoardRole;
      revokeUserId?: string;
      revokeInviteId?: string;
    };
    if (body.revokeUserId) {
      if (body.revokeUserId === user.record.id) throw new Error("You cannot revoke your own access.");
      BoardMember.revokeAccess(id, body.revokeUserId);
    } else if (body.revokeInviteId) {
      Invitation.revoke(body.revokeInviteId, id);
    } else {
      Invitation.create(id, body.email ?? "", body.role ?? "viewer");
    }
    return NextResponse.json({
      members: BoardMember.list(id),
      invitations: Invitation.list(id),
    });
  } catch (error) {
    return jsonError(error);
  }
}
