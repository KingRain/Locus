import type { Tool } from "@/lib/types";

export const TOOL_SHORTCUTS: Partial<Record<Tool, string>> = {
  select: "V",
  pen: "P",
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

export const NUMBER_SHORTCUTS: Partial<Record<Tool, string>> = {
  select: "1",
  pen: "2",
  line: "3",
  arrow: "4",
  ellipse: "5",
  rect: "6",
  diamond: "7",
  text: "8",
  sticky: "9",
  eraser: "0",
};

const SHORTCUT_TO_TOOL: Record<string, Tool> = {
  ...Object.fromEntries(
    Object.entries(TOOL_SHORTCUTS).map(([tool, key]) => [key.toLowerCase(), tool as Tool]),
  ),
  ...Object.fromEntries(
    Object.entries(NUMBER_SHORTCUTS).map(([tool, key]) => [key, tool as Tool]),
  ),
};

export function toolFromShortcut(key: string): Tool | null {
  return SHORTCUT_TO_TOOL[key.toLowerCase()] ?? null;
}
