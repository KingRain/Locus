import type { Tool } from "@/lib/types";

export const TOOL_SHORTCUTS: Partial<Record<Tool, string>> = {
  select: "V",
  hand: "H",
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
  hand: "2",
  pen: "3",
  line: "4",
  arrow: "5",
  ellipse: "6",
  rect: "7",
  diamond: "8",
  text: "9",
  sticky: "0",
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
