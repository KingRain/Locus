"use client";

import { useMemo, useState } from "react";
import { X, Download, FileImage, FileCode } from "lucide-react";
import type { ShapeData } from "../../../liveblocks.config";
import {
  generateBoardSvg,
  exportBoardToPng,
  computeBoardBounds,
} from "@/board/export/board-export";

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardTitle: string;
  elements: ShapeData[];
}

export function ExportModal({
  isOpen,
  onClose,
  boardTitle,
  elements,
}: ExportModalProps) {
  const [format, setFormat] = useState<"svg" | "png">("png");
  const [darkMode, setDarkMode] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const svgString = useMemo(() => {
    return generateBoardSvg(boardTitle, elements, { darkMode, showTitle });
  }, [boardTitle, elements, darkMode, showTitle]);

  const bounds = useMemo(() => {
    return computeBoardBounds(elements, 60);
  }, [elements]);

  if (!isOpen) return null;

  async function handleDownload() {
    setIsExporting(true);
    try {
      const fileName = `${boardTitle.toLowerCase().replaceAll(/\s+/g, "-") || "board"}.${format}`;
      if (format === "svg") {
        const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = await exportBoardToPng(svgString, bounds.width, bounds.height);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
      onClose();
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-warm-stone bg-paper-white shadow-2xl dark:border-border dark:bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-warm-stone/60 px-6 py-4 dark:border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-pulse/15 text-mint-pulse">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-inkwell-navy dark:text-foreground">
                Export Board
              </h2>
              <p className="text-xs text-slate">
                Download high-resolution vector or raster image of your board.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate transition hover:bg-ash-canvas dark:hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-5">
          {/* SVG Live Preview (Left / Top) */}
          <div className="col-span-3 flex flex-col items-center justify-center bg-ash-canvas/50 p-6 dark:bg-slate-900/50">
            <div className="relative flex max-h-[360px] w-full items-center justify-center overflow-auto rounded-xl border border-warm-stone/60 bg-paper-white p-4 shadow-sm dark:border-border/60 dark:bg-card">
              <div
                className="max-h-[320px] max-w-full overflow-hidden object-contain"
                dangerouslySetInnerHTML={{ __html: svgString }}
              />
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate">
              <span>
                Elements: <strong className="text-inkwell-navy dark:text-foreground">{elements.length}</strong>
              </span>
              <span>•</span>
              <span>
                Dimensions: <strong className="text-inkwell-navy dark:text-foreground">{bounds.width} × {bounds.height} px</strong>
              </span>
            </div>
          </div>

          {/* Export Settings (Right) */}
          <div className="col-span-2 flex flex-col justify-between border-t border-warm-stone/60 p-6 dark:border-border/60 md:border-l md:border-t-0">
            <div className="space-y-5">
              {/* Format selection */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate">
                  Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat("png")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition ${
                      format === "png"
                        ? "border-mint-pulse bg-mint-pulse/10 text-inkwell-navy dark:text-foreground font-semibold shadow-sm"
                        : "border-warm-stone text-slate hover:bg-ash-canvas dark:border-border"
                    }`}
                  >
                    <FileImage className="h-4 w-4 text-mint-pulse" />
                    PNG Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("svg")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-medium transition ${
                      format === "svg"
                        ? "border-mint-pulse bg-mint-pulse/10 text-inkwell-navy dark:text-foreground font-semibold shadow-sm"
                        : "border-warm-stone text-slate hover:bg-ash-canvas dark:border-border"
                    }`}
                  >
                    <FileCode className="h-4 w-4 text-coral-emphasis" />
                    SVG Vector
                  </button>
                </div>
              </div>

              {/* Theme & Options */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate">
                  Appearance
                </label>

                <label className="flex items-center justify-between rounded-xl border border-warm-stone p-3 cursor-pointer text-xs font-medium text-inkwell-navy dark:border-border dark:text-foreground hover:bg-ash-canvas/50">
                  <span>Dark Mode Theme</span>
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    className="h-4 w-4 rounded border-slate text-mint-pulse focus:ring-mint-pulse"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-warm-stone p-3 cursor-pointer text-xs font-medium text-inkwell-navy dark:border-border dark:text-foreground hover:bg-ash-canvas/50">
                  <span>Include Board Title</span>
                  <input
                    type="checkbox"
                    checked={showTitle}
                    onChange={(e) => setShowTitle(e.target.checked)}
                    className="h-4 w-4 rounded border-slate text-mint-pulse focus:ring-mint-pulse"
                  />
                </label>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-warm-stone/60 pt-4 dark:border-border/60">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-warm-stone px-4 py-2.5 text-xs font-medium text-slate transition hover:bg-ash-canvas dark:border-border dark:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={isExporting}
                className="flex items-center gap-2 rounded-xl bg-mint-pulse px-5 py-2.5 text-xs font-semibold text-inkwell-navy transition hover:opacity-90 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Exporting..." : `Download ${format.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
