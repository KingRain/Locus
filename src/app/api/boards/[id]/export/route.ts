import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import { boardManager } from "@/board/Board";
import { permissionChecker } from "@/sharing/PermissionChecker";
import { jsonError, requireUser } from "@/lib/http";
import { generateBoardSvg } from "@/board/export/board-export";
import type { ShapeData } from "@/../liveblocks.config";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

type Ctx = { params: Promise<{ id: string }> };

function parseStorageElements(data: unknown): ShapeData[] {
  const elements: ShapeData[] = [];
  const storage = data as Record<string, unknown>;
  const elementsMap = storage?.elements;
  if (!elementsMap || typeof elementsMap !== "object") return elements;

  const entries = Object.entries(elementsMap as Record<string, Record<string, unknown>>);
  for (const [, value] of entries) {
    if (value && typeof value === "object" && "type" in value) {
      elements.push({
        id: (value.id as string) ?? "",
        boardId: (value.boardId as string) ?? "",
        type: (value.type as any) ?? "",
        x: (value.x as number) ?? 0,
        y: (value.y as number) ?? 0,
        width: (value.width as number) ?? 0,
        height: (value.height as number) ?? 0,
        rotation: (value.rotation as number) ?? 0,
        fill: (value.fill as string) ?? "#ffffff",
        stroke: (value.stroke as string) ?? "#151b31",
        strokeStyle: (value.strokeStyle as any) ?? "solid",
        text: (value.text as string) ?? "",
        textAlign: (value.textAlign as "left" | "center" | "right") ?? "left",
        fromId: (value.fromId as string) ?? null,
        toId: (value.toId as string) ?? null,
        cx: (value.cx as number) ?? 0,
        cy: (value.cy as number) ?? 0,
        fontSize: value.fontSize as number | undefined,
        shapeId: value.shapeId as string | undefined,
        zIndex: (value.zIndex as number) ?? 0,
        updatedAt: (value.updatedAt as number) ?? Date.now(),
      });
    }
  }
  return elements;
}

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const { user } = await requireUser();
    const { id } = await ctx.params;
    const board = boardManager.requireView(id, user.record.id);
    if (!permissionChecker.canView(id, user.record.id)) {
      throw new Error("You cannot export this board.");
    }

    const { data } = await liveblocks.getStorageDocument(id);
    const elements = parseStorageElements(data);
    const svg = generateBoardSvg(board.record.title, elements);

    return NextResponse.json({ svg });
  } catch (error) {
    return jsonError(error);
  }
}

