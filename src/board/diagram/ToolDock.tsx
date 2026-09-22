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
        className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-warm-stone/80 bg-paper-white/95 p-1.5 shadow-[var(--shadow-stone)] backdrop-blur-md dark:border-border dark:bg-card/95 dark:shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
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
                  ? "bg-[#fef08a]/80 text-[#713f12] shadow-sm ring-1 ring-[#fde047] dark:bg-white dark:text-black dark:ring-0 dark:shadow-md"
                  : "text-slate-600 hover:bg-ash-canvas hover:text-inkwell-navy dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white disabled:opacity-40"
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
