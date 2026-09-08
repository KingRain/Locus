import { NextResponse } from "next/server";
import { boardManager } from "@/board/Board";
import { jsonError, requireUser } from "@/lib/http";
import type { BoardStatus, TemplateKind } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { user } = await requireUser();
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const status = (url.searchParams.get("status") ?? "active") as BoardStatus;
    return NextResponse.json({ boards: boardManager.listForUser(user.record.id, q, status) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const body = (await request.json()) as { title?: string; templateKind?: TemplateKind };
    const board = boardManager.create(user.record.id, body.title ?? "Untitled board", body.templateKind);
    return NextResponse.json({ board: board.record });
  } catch (error) {
    return jsonError(error);
  }
}
