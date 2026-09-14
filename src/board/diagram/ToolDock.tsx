"use client";

import type { LucideIcon } from "lucide-react";
import { TOOL_ICONS } from "@/components/icons";
import type { Tool } from "@/lib/types";
import { TOOL_SHORTCUTS, NUMBER_SHORTCUTS } from "@/board/diagram/tool-shortcuts";

const DOCK_TOOLS: Tool[] = [
  "select",
  "hand",
  "pen",
  "line",
  "arrow",
  "ellipse",
  "rect",
  "diamond",
  "text",
  "sticky",
  "eraser",
];

const LABELS: Partial<Record<Tool, string>> = {
  select: "Select",
  hand: "Hand / Pan",
  pen: "Pen",
  line: "Line",
  arrow: "Arrow",
  ellipse: "Circle",
  rect: "Box",
  diamond: "Diamond",
  text: "Text",
  sticky: "Sticky",
  eraser: "Eraser",
};

export function ToolDock({
  tool,
  onTool,
  canEdit,
}: {
  tool: Tool;
  onTool: (tool: Tool) => void;
  canEdit: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-4 select-none">
      <div
        className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
        role="toolbar"
        aria-label="Drawing tools"
      >
        {DOCK_TOOLS.map((id) => {
          const Icon: LucideIcon = TOOL_ICONS[id];
          const active = tool === id;
          const disabled = !canEdit && id !== "select" && id !== "hand";
          const letterShortcut = TOOL_SHORTCUTS[id];
          const numberShortcut = NUMBER_SHORTCUTS[id];
          const label = LABELS[id];
          const shortcutStr = [numberShortcut, letterShortcut].filter(Boolean).join(", ");
          const title = shortcutStr ? `${label} (${shortcutStr})` : label;

          return (
            <button
              key={id}
              type="button"
              title={title}
              aria-label={title}
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onTool(id)}
              className={`grid h-10 w-10 place-items-center rounded-xl transition-all duration-150 ${
                active
                  ? "bg-[#fef08a]/80 text-[#713f12] shadow-sm ring-1 ring-[#fde047] dark:bg-[#713f12]/60 dark:text-[#fef08a] dark:ring-[#a16207]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 disabled:opacity-40"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] transition-transform ${
                  active ? "scale-105 fill-current" : "fill-none"
                }`}
                strokeWidth={active ? 1.5 : 1.75}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
