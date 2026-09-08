import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import { boardManager } from "@/board/Board";
import { jsonError, requireUser } from "@/lib/http";
import type { BoardStatus, TemplateKind } from "@/lib/types";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY ?? "",
});

export async function GET(request: Request) {
  try {
    const { user } = await requireUser();
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const status = (url.searchParams.get("status") ?? "active") as BoardStatus;
    const scope = url.searchParams.get("scope") ?? "mine";
    const boards =
      scope === "shared"
        ? boardManager.listSharedWithUser(user.record.id, q, status)
        : boardManager.listForUser(user.record.id, q, status);
    return NextResponse.json({ boards });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const body = (await request.json()) as { title?: string; templateKind?: TemplateKind };
    const board = boardManager.create(user.record.id, body.title ?? "Untitled board", body.templateKind);

    await liveblocks.createRoom(board.record.id, {
      defaultAccesses: [],
      usersAccesses: {
        [user.record.id]: ["room:write"],
      },
    });

    return NextResponse.json({ board: board.record });
  } catch (error) {
    return jsonError(error);
  }
}
