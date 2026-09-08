import { NextResponse } from "next/server";
import { boardManager } from "@/board/Board";
import { ExportManager } from "@/export/ExportManager";
import { permissionChecker } from "@/sharing/PermissionChecker";
import { jsonError, requireUser } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    const board = boardManager.requireView(id, user.record.id);
    if (!permissionChecker.canView(id, user.record.id)) {
      throw new Error("You cannot export this board.");
    }
    const result = ExportManager.exportSvg(id, board.record.title);
    const svg = ExportManager.toSvg(id, board.record.title);
    return NextResponse.json({ ...result, svg });
  } catch (error) {
    return jsonError(error);
  }
}
