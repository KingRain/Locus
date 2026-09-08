"use client";

import type { LucideIcon } from "lucide-react";
import { TOOL_ICONS } from "@/components/icons";
import type { Tool } from "@/lib/types";
import { TOOL_SHORTCUTS, NUMBER_SHORTCUTS } from "@/board/diagram/tool-shortcuts";

const DOCK_TOOLS: Tool[] = [
  "select",
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
  pen: "Pen",
  line: "Line",
  arrow: "Arrow",
  ellipse: "Circle",
  rect: "Box",
  diamond: "Diamond",
  connector: "Connect",
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
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-4">
      <div
        className="pointer-events-auto flex items-center gap-1 rounded-lg border border-warm-stone bg-paper-white/95 p-1.5 shadow-[var(--shadow-stone)] backdrop-blur-sm dark:border-border/60 dark:bg-card/90 dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
        role="toolbar"
        aria-label="Drawing tools"
      >
        {DOCK_TOOLS.map((id) => {
          const Icon: LucideIcon = TOOL_ICONS[id];
          const active = tool === id;
          const disabled = !canEdit && id !== "select";
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
              className={`grid h-10 w-10 place-items-center rounded-md transition-colors ${
                active
                  ? "bg-inkwell-navy/70 text-paper-white"
                  : "text-inkwell-navy hover:bg-ash-canvas disabled:opacity-40"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
