"use client";

import { use } from "react";
import { BoardWorkspace } from "@/board/diagram/CanvasEditor";

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BoardWorkspace boardId={id} />;
}
