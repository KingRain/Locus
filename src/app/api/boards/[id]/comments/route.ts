import { NextResponse } from "next/server";
import { boardManager } from "@/board/Board";
import { CommentThread } from "@/comments/Comment";
import { permissionChecker } from "@/sharing/PermissionChecker";
import { jsonError, requireUser } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    boardManager.requireView(id, user.record.id);
    return NextResponse.json({ comments: CommentThread.list(id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    boardManager.requireView(id, user.record.id);
    if (!permissionChecker.canComment(id, user.record.id)) {
      throw new Error("You cannot comment on this board.");
    }
    const body = (await request.json()) as {
      content?: string;
      parentId?: string;
      resolveId?: string;
    };
    if (body.resolveId) {
      CommentThread.resolve(id, body.resolveId);
    } else {
      CommentThread.add({
        boardId: id,
        userId: user.record.id,
        content: body.content ?? "",
        parentId: body.parentId,
      });
    }
    return NextResponse.json({ comments: CommentThread.list(id) });
  } catch (error) {
    return jsonError(error);
  }
}
