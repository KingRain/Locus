import { DiagramElement } from "../board/diagram/DiagramElement";
import { getDb, newId, now } from "../persistence/db";
import { relativeStoragePath, saveExportFile } from "../persistence/files";
import { generateBoardSvg } from "../board/export/board-export";
import type { ShapeData } from "../../liveblocks.config";

export class ExportManager {
  static toSvg(boardId: string, title: string): string {
    const records = DiagramElement.list(boardId);
    const elements: ShapeData[] = records.map((r) => ({
      id: r.id,
      boardId: r.boardId,
      type: r.type,
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      rotation: r.rotation,
      fill: r.fill,
      stroke: r.stroke,
      strokeStyle: "solid",
      text: r.text,
      textAlign: r.textAlign,
      fromId: r.fromId,
      toId: r.toId,
      cx: 0,
      cy: 0,
      zIndex: r.zIndex,
      updatedAt: r.updatedAt,
    }));
    return generateBoardSvg(title, elements);
  }

  static exportSvg(boardId: string, title: string): { id: string; path: string } {
    const svg = ExportManager.toSvg(boardId, title);
    const filePath = saveExportFile(boardId, "svg", Buffer.from(svg, "utf8"));
    const id = newId();
    getDb()
      .prepare(
        "INSERT INTO exports (id, board_id, format, file_path, created_at) VALUES (?, ?, 'svg', ?, ?)",
      )
      .run(id, boardId, relativeStoragePath(filePath), now());
    return { id, path: relativeStoragePath(filePath) };
  }
}

