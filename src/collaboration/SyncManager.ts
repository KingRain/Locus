import type { BoardOperation, DiagramElementRecord } from "../lib/types";
import { DiagramElement } from "../board/diagram/DiagramElement";
import { permissionChecker } from "../sharing/PermissionChecker";
import { Board } from "../board/Board";

export class SyncManager {
  apply(boardId: string, userId: string, operation: BoardOperation): BoardOperation {
    if (!permissionChecker.canEdit(boardId, userId)) {
      throw new Error("You cannot edit this board.");
    }
    if (operation.kind === "upsert") {
      const element: DiagramElementRecord = { ...operation.element, boardId };
      const saved = DiagramElement.upsert(element);
      Board.get(boardId)?.touch();
      return { kind: "upsert", element: saved };
    }
    if (operation.kind === "delete") {
      DiagramElement.delete(boardId, operation.elementId);
      Board.get(boardId)?.touch();
      return operation;
    }
    DiagramElement.replaceAll(boardId, operation.elements.map((el) => ({ ...el, boardId })));
    Board.get(boardId)?.touch();
    return { kind: "replaceAll", elements: DiagramElement.list(boardId) };
  }
}

export const syncManager = new SyncManager();
