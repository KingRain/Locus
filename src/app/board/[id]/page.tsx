"use client";

import { use } from "react";
import { BoardWorkspace } from "@/board/diagram/CanvasEditor";
import { BoardRoom } from "./BoardRoom";

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <BoardRoom boardId={id}>
      <BoardWorkspace boardId={id} />
    </BoardRoom>
  );
}
