import type { LiveMap, LiveObject } from "@liveblocks/client";
import type { ElementType } from "./src/lib/types";

export type ShapeData = {
  id: string;
  boardId: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeStyle: "solid" | "dashed" | "dotted";
  text: string;
  textAlign: "left" | "center" | "right";
  fromId: string | null;
  toId: string | null;
  cx: number;
  cy: number;
  fontSize?: number;
  shapeId?: string;
  zIndex: number;
  updatedAt: number;
};

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
    };
    Storage: {
      elements: LiveMap<string, LiveObject<ShapeData>>;
    };
    UserMeta: {
      id: string;
      info: {
        name: string;
        color: string;
        avatar: string;
      };
    };
  }
}
