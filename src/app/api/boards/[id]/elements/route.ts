import { NextResponse } from "next/server";
import { boardManager } from "@/board/Board";
import { DiagramElement } from "@/board/diagram/DiagramElement";
import { permissionChecker } from "@/sharing/PermissionChecker";
import { jsonError, requireUser } from "@/lib/http";
import type { DiagramElementRecord } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    boardManager.requireView(id, user.record.id);
    if (!permissionChecker.canEdit(id, user.record.id)) {
      throw new Error("You cannot edit this board.");
    }
    const body = (await request.json()) as { elements: DiagramElementRecord[] };
    DiagramElement.replaceAll(id, body.elements ?? []);
    return NextResponse.json({ elements: DiagramElement.list(id) });
  } catch (error) {
    return jsonError(error);
  }
}
