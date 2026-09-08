import { NextResponse } from "next/server";
import { boardManager } from "@/board/Board";
import { DiagramElement } from "@/board/diagram/DiagramElement";
import { permissionChecker } from "@/sharing/PermissionChecker";
import { jsonError, requireUser } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    const board = boardManager.requireView(id, user.record.id);
    return NextResponse.json({
      board: board.record,
      role: permissionChecker.roleFor(id, user.record.id),
      elements: DiagramElement.list(id),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    const board = boardManager.require(id);
    const body = (await request.json()) as { title?: string; status?: "active" | "archived" };
    let next = board;

    if (body.title !== undefined) {
      if (!permissionChecker.canEdit(id, user.record.id)) {
        throw new Error("You cannot rename this board.");
      }
      next = next.rename(body.title);
    }

    if (body.status === "archived" || body.status === "active") {
      if (!permissionChecker.canManage(id, user.record.id)) {
        throw new Error("You cannot manage this board.");
      }
      next = body.status === "archived" ? next.archive() : next.restore();
    }

    return NextResponse.json({ board: next.record });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    if (!permissionChecker.canManage(id, user.record.id)) {
      throw new Error("You cannot delete this board.");
    }
    boardManager.require(id).delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
