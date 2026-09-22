"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { History, Share2, X, Shapes, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type BoardPanel = "none" | "share" | "history" | "shapes" | "ai";

const PANEL_META: Record<Exclude<BoardPanel, "none">, { title: string; icon: typeof Share2 }> = {
  share: {
    title: "Share",
    icon: Share2,
  },
  history: {
    title: "History",
    icon: History,
  },
  shapes: {
    title: "Shapes",
    icon: Shapes,
  },
  ai: {
    title: "AI Assistant",
    icon: Sparkles,
  },
};

export function BoardSidePanel({
  panel,
  onClose,
  children,
}: {
  panel: BoardPanel;
  onClose: () => void;
  children: ReactNode;
}) {
  const open = panel !== "none";
  const meta = panel !== "none" ? PANEL_META[panel] : null;
  const Icon = meta?.icon;

  return (
    <AnimatePresence>
      {open && meta && Icon ? (
        <motion.aside
          key={panel}
          data-side-panel="true"
          onWheel={(e) => e.stopPropagation()}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          className={cn(
            "absolute right-3 top-[64px] bottom-3 z-30 flex w-[min(100%,360px)] flex-col overflow-hidden",
            "rounded-2xl border border-warm-stone/80 bg-paper-white/95 shadow-[0_8px_32px_rgba(21,27,49,0.12)] backdrop-blur-md ring-1 ring-[#fde047]/30",
            "dark:border-border/50 dark:bg-card/95 dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] dark:ring-[#a16207]/30",
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-warm-stone/70 px-3.5 py-3 dark:border-border/70">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fef08a]/70 text-[#713f12] ring-1 ring-[#fde047]/70 dark:bg-[#713f12]/50 dark:text-[#fef08a] dark:ring-[#a16207]/60">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[14px] font-bold text-inkwell-navy dark:text-foreground">{meta.title}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close panel" className="h-7 w-7 text-slate hover:bg-[#fef08a]/30 hover:text-[#713f12] dark:hover:bg-[#713f12]/30 dark:hover:text-[#fef08a]">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-3">{children}</div>
          </ScrollArea>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

export function PanelSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-3", className)}>
      {title ? (
        <>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#fde047] dark:bg-[#a16207]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">{title}</p>
          </div>
          <Separator className="bg-warm-stone/70 dark:bg-border/70" />
        </>
      ) : null}
      {children}
    </section>
  );
}
