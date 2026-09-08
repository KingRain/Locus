import { NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import { boardManager } from "@/board/Board";
import { permissionChecker } from "@/sharing/PermissionChecker";
import { jsonError, requireUser } from "@/lib/http";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

type Ctx = { params: Promise<{ id: string }> };

type ShapeData = {
  id: string;
  boardId: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  text: string;
  fromId: string | null;
  toId: string | null;
  zIndex: number;
  updatedAt: number;
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function elementSvg(element: ShapeData): string {
  const common = `fill="${element.fill}" stroke="${element.stroke}" stroke-width="2"`;
  const label = escapeXml(element.text);
  if (element.type === "ellipse") {
    return `<g>
      <ellipse cx="${element.x + element.width / 2}" cy="${element.y + element.height / 2}" rx="${element.width / 2}" ry="${element.height / 2}" ${common} />
      <text x="${element.x + element.width / 2}" y="${element.y + element.height / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="14" fill="#151b31">${label}</text>
    </g>`;
  }
  if (element.type === "diamond") {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    const points = `${cx},${element.y} ${element.x + element.width},${cy} ${cx},${element.y + element.height} ${element.x},${cy}`;
    return `<g>
      <polygon points="${points}" ${common} />
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="Inter, sans-serif" font-size="14" fill="#151b31">${label}</text>
    </g>`;
  }
  if (element.type === "connector") {
    return "";
  }
  if (element.type === "text") {
    return `<text x="${element.x + 12}" y="${element.y + 24}" font-family="Inter, sans-serif" font-size="14" fill="#151b31">${label}</text>`;
  }
  if (element.type === "path") {
    return `<path d="${escapeXml(element.text)}" fill="none" stroke="${element.stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
  }
  if (element.type === "line" || element.type === "arrow") {
    const x2 = element.x + element.width;
    const y2 = element.y + element.height;
    const line = `<line x1="${element.x}" y1="${element.y}" x2="${x2}" y2="${y2}" stroke="${element.stroke}" stroke-width="2" stroke-linecap="round" />`;
    if (element.type === "arrow") {
      const angle = Math.atan2(y2 - element.y, x2 - element.x);
      const size = 10;
      const ax = x2 - size * Math.cos(angle - Math.PI / 6);
      const ay = y2 - size * Math.sin(angle - Math.PI / 6);
      const bx = x2 - size * Math.cos(angle + Math.PI / 6);
      const by = y2 - size * Math.sin(angle + Math.PI / 6);
      return `${line}<polygon points="${x2},${y2} ${ax},${ay} ${bx},${by}" fill="${element.stroke}" />`;
    }
    return line;
  }
  const fill = element.type === "sticky" ? element.fill : element.fill;
  return `<g>
    <rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" rx="8" ${common.replace(element.fill, fill)} />
    <text x="${element.x + 12}" y="${element.y + 24}" font-family="Inter, sans-serif" font-size="14" fill="#151b31">${label}</text>
  </g>`;
}

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
        type: (value.type as string) ?? "",
        x: (value.x as number) ?? 0,
        y: (value.y as number) ?? 0,
        width: (value.width as number) ?? 0,
        height: (value.height as number) ?? 0,
        rotation: (value.rotation as number) ?? 0,
        fill: (value.fill as string) ?? "#ffffff",
        stroke: (value.stroke as string) ?? "#151b31",
        text: (value.text as string) ?? "",
        fromId: (value.fromId as string) ?? null,
        toId: (value.toId as string) ?? null,
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
    const body = elements.map(elementSvg).join("\n");
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#f2f2f2" />
  <text x="32" y="40" font-family="Inter, sans-serif" font-size="20" fill="#151b31">${escapeXml(board.record.title)}</text>
  ${body}
</svg>`;

    return NextResponse.json({ svg });
  } catch (error) {
    return jsonError(error);
  }
}
