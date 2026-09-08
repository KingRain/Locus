import { NextResponse } from "next/server";
import { boardManager } from "@/board/Board";
import { VersionManager } from "@/history/VersionManager";
import { permissionChecker } from "@/sharing/PermissionChecker";
import { jsonError, requireUser } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    boardManager.requireView(id, user.record.id);
    return NextResponse.json({ versions: VersionManager.list(id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    boardManager.requireView(id, user.record.id);
    const body = (await request.json()) as {
      label?: string;
      restoreId?: string;
      previewId?: string;
    };
    if (body.previewId) {
      return NextResponse.json({ elements: VersionManager.preview(id, body.previewId) });
    }
    if (body.restoreId) {
      if (!permissionChecker.canManage(id, user.record.id)) {
        throw new Error("Only the owner can restore a version.");
      }
      VersionManager.restore(id, body.restoreId, user.record.id);
      return NextResponse.json({ versions: VersionManager.list(id), restored: true });
    }
    if (!permissionChecker.canEdit(id, user.record.id)) {
      throw new Error("You cannot save a version of this board.");
    }
    VersionManager.capture(id, user.record.id, body.label?.trim() || "Manual snapshot");
    return NextResponse.json({ versions: VersionManager.list(id) });
  } catch (error) {
    return jsonError(error);
  }
}
