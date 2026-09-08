"use client";

import type { LucideIcon } from "lucide-react";
import { TOOL_ICONS } from "@/components/icons";
import type { Tool } from "@/lib/types";
import { TOOL_SHORTCUTS } from "@/board/diagram/tool-shortcuts";

const DOCK_TOOLS: Tool[] = [
  "select",
  "pen",
  "line",
  "arrow",
  "ellipse",
  "rect",
  "diamond",
  "connector",
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
        className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-warm-stone bg-paper-white/95 p-2 shadow-[var(--shadow-stone)] backdrop-blur-sm"
        role="toolbar"
        aria-label="Drawing tools"
      >
        {DOCK_TOOLS.map((id) => {
          const Icon: LucideIcon = TOOL_ICONS[id];
          const active = tool === id;
          const disabled = !canEdit && id !== "select";
          const shortcut = TOOL_SHORTCUTS[id];
          const label = LABELS[id];
          const title = shortcut ? `${label} (${shortcut})` : label;
          return (
            <button
              key={id}
              type="button"
              title={title}
              aria-label={title}
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onTool(id)}
              className={`relative grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                active
                  ? "bg-inkwell-navy text-paper-white"
                  : "text-inkwell-navy hover:bg-ash-canvas disabled:opacity-40"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {shortcut ? (
                <span
                  className={`absolute -bottom-0.5 right-0.5 rounded px-0.5 text-[8px] font-bold leading-none ${
                    active ? "text-paper-white/70" : "text-slate/60"
                  }`}
                >
                  {shortcut}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
