import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const STORAGE = path.join(process.cwd(), "storage");

export function saveExportFile(boardId: string, format: "svg" | "png", bytes: Buffer): string {
  const dir = path.join(STORAGE, "exports", boardId);
  mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${Date.now()}.${format}`);
  writeFileSync(filePath, bytes);
  return filePath;
}

export function saveMediaFile(boardId: string, filename: string, bytes: Buffer): string {
  const dir = path.join(STORAGE, "media", boardId);
  mkdirSync(dir, { recursive: true });
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = path.join(dir, `${Date.now()}-${safe}`);
  writeFileSync(filePath, bytes);
  return filePath;
}

export function relativeStoragePath(absolutePath: string): string {
  return path.relative(process.cwd(), absolutePath);
}
