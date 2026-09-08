import { NextResponse } from "next/server";
import { boardManager } from "@/board/Board";
import { permissionChecker } from "@/sharing/PermissionChecker";
import { jsonError, requireUser } from "@/lib/http";
import { VersionManager } from "@/history/VersionManager";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    boardManager.requireView(id, user.record.id);
    const versions = VersionManager.list(id);
    return NextResponse.json({ versions });
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
    };

    if (!permissionChecker.canEdit(id, user.record.id)) {
      throw new Error("You cannot save a version of this board.");
    }

    const label = body.label?.trim() || "Manual snapshot";
    VersionManager.capture(id, user.record.id, label);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
