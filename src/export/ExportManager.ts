import { DiagramElement } from "../board/diagram/DiagramElement";
import { getDb, newId, now } from "../persistence/db";
import { relativeStoragePath, saveExportFile } from "../persistence/files";
import type { DiagramElementRecord } from "../lib/types";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function elementSvg(element: DiagramElementRecord): string {
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

export class ExportManager {
  static toSvg(boardId: string, title: string): string {
    const elements = DiagramElement.list(boardId);
    const body = elements.map(elementSvg).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#f2f2f2" />
  <text x="32" y="40" font-family="Inter, sans-serif" font-size="20" fill="#151b31">${escapeXml(title)}</text>
  ${body}
</svg>`;
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
