import type { Tool } from "@/lib/types";

export const TOOL_SHORTCUTS: Partial<Record<Tool, string>> = {
  select: "V",
  pen: "B",
  eraser: "E",
  line: "L",
  arrow: "A",
  ellipse: "O",
  rect: "R",
  diamond: "D",
  connector: "C",
  text: "T",
  sticky: "S",
};

const SHORTCUT_TO_TOOL = Object.fromEntries(
  Object.entries(TOOL_SHORTCUTS).map(([tool, key]) => [key.toLowerCase(), tool]),
) as Record<string, Tool>;

export function toolFromShortcut(key: string): Tool | null {
  return SHORTCUT_TO_TOOL[key.toLowerCase()] ?? null;
}
