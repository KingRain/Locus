"use client";

import { Plus, Minus, Maximize2 } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitCanvas?: () => void;
}

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitCanvas,
}: ZoomControlsProps) {
  const percentage = Math.round(zoom * 100);

  return (
    <div className="pointer-events-none absolute left-6 bottom-6 z-20 flex items-center gap-1 rounded-lg border border-warm-stone bg-paper-white/95 p-1 shadow-[var(--shadow-stone)] backdrop-blur-sm dark:border-border/60 dark:bg-card/90">
      <button
        type="button"
        title="Zoom Out (-)"
        onClick={onZoomOut}
        className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground"
      >
        <Minus className="h-4 w-4" />
      </button>

      <button
        type="button"
        title="Reset Zoom to 100%"
        onClick={onResetZoom}
        className="pointer-events-auto px-2 py-1 text-[12px] font-semibold text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground"
      >
        {percentage}%
      </button>

      <button
        type="button"
        title="Zoom In (+)"
        onClick={onZoomIn}
        className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground"
      >
        <Plus className="h-4 w-4" />
      </button>

      <div className="h-4 w-px bg-warm-stone/60 dark:bg-border/60" />

      {onFitCanvas ? (
        <button
          type="button"
          title="Fit Canvas"
          onClick={onFitCanvas}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
