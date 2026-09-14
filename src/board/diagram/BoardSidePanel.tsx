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
            "rounded-2xl border border-warm-stone/80 bg-paper-white/95 shadow-[0_8px_32px_rgba(21,27,49,0.12)] backdrop-blur-md",
            "dark:border-border/50 dark:bg-card/95 dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-warm-stone/70 px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ash-canvas text-inkwell-navy dark:bg-card dark:text-foreground">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[14px] font-bold text-inkwell-navy dark:text-foreground">{meta.title}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close panel" className="h-7 w-7">
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">{title}</p>
          <Separator className="bg-warm-stone/70" />
        </>
      ) : null}
      {children}
    </section>
  );
}
