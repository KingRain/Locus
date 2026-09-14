"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { LiveObject } from "@liveblocks/client";
import {
  useStorage,
  useMutation,
  useOthers,
  useUpdateMyPresence,
  useUndo,
  useRedo,
} from "@liveblocks/react/suspense";
import type { ShapeData } from "../../../liveblocks.config";
import { api } from "@/lib/api";
import { Logo } from "@/components/brand";
import {
  Share2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "@/components/icons";
import { Send, Shapes, Sparkles, Trash2, Copy, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/locus-ui";
import { BoardSidePanel } from "@/board/diagram/BoardSidePanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button as ShadButton } from "@/components/ui/button";
import { ContextMenu } from "@/components/canvas/ContextMenu";
import { ZoomControls } from "@/components/canvas/ZoomControls";
import { HamburgerMenu } from "@/components/canvas/HamburgerMenu";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ExportModal } from "@/components/canvas/ExportModal";
import { ToolDock } from "@/board/diagram/ToolDock";
import { EditableBoardTitle } from "@/board/diagram/EditableBoardTitle";
import { getShapeDefinition } from "@/board/diagram/shapes/shape-library";
import { useTheme } from "@/components/theme-provider";
import { recordRecentBoard } from "@/lib/recent-boards";
import {
  clamp,
  elementIntersectsRect,
  FILL_PALETTE,
  hitTest,
  hitTestEraser,
  translatePath,
} from "@/board/diagram/canvas-utils";
import { computePretextLayout } from "@/board/diagram/pretext-text";
import { toolFromShortcut } from "@/board/diagram/tool-shortcuts";
import type {
  BoardRecord,
  BoardRole,
  CommentRecord,
  DiagramElementRecord,
  ElementType,
  InvitationRecord,
  Tool,
  VersionRecord,
} from "@/lib/types";

function defaultFill(type: string): string {
  if (type === "sticky") return "#fedf89";
  return "#ffffff";
}

function measureText(text: string): { width: number; height: number } {
  if (typeof document === "undefined") return { width: 200, height: 48 };
  const span = document.createElement("span");
  span.style.cssText = "position:absolute;visibility:hidden;font-size:14px;font-family:Inter,system-ui,sans-serif;white-space:pre;";
  document.body.appendChild(span);
  const lines = text.split("\n");
  let maxWidth = 0;
  for (const line of lines) {
    span.textContent = line || " ";
    maxWidth = Math.max(maxWidth, span.getBoundingClientRect().width);
  }
  document.body.removeChild(span);
  const lineHeight = 18;
  const height = Math.max(48, lines.length * lineHeight + 32);
  const width = Math.max(80, maxWidth + 28);
  return { width, height };
}

function toolToElementType(tool: Tool): ElementType | null {
  const map: Partial<Record<Tool, ElementType>> = {
    rect: "rect",
    ellipse: "ellipse",
    diamond: "diamond",
    text: "text",
    sticky: "sticky",
    line: "line",
    arrow: "arrow",
  };
  return map[tool] ?? null;
}

import { Shape } from "@/board/diagram/Shape";

export function BoardWorkspace({ boardId }: { boardId: string }) {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [board, setBoard] = useState<BoardRecord | null>(null);
  const [role, setRole] = useState<BoardRole>("viewer");
  const canEdit = role === "owner" || role === "editor";
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [panel, setPanel] = useState<"none" | "share" | "history" | "shapes" | "ai">("none");
  const pointersRef = useRef(new Map<number, { x: number, y: number }>());
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [members, setMembers] = useState<{ name?: string; email?: string; role: string; userId: string; avatar?: string }[]>([]);
  const [invites, setInvites] = useState<InvitationRecord[]>([]);
  const [preview, setPreview] = useState<{ kind: "line" | "rect"; x1: number; y1: number; x2: number; y2: number } | { kind: "path"; d: string } | { kind: "marquee"; x1: number; y1: number; x2: number; y2: number } | null>(null);

  const drag = useRef<{
    startX: number;
    startY: number;
    initials: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      cx: number;
      cy: number;
      type: ElementType;
      text: string;
    }>;
  } | null>(null);
  const resize = useRef<{ id: string; handle: string; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number } | null>(null);
  const arrowJoint = useRef<{ id: string; joint: "start" | "middle" | "end"; startX: number; startY: number } | null>(null);
  const draft = useRef<{ type: ElementType; x: number; y: number } | null>(null);
  const penStroke = useRef<{ points: { x: number; y: number }[] } | null>(null);
  const connectorFrom = useRef<string | null>(null);
  const panRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const marqueeRef = useRef<{ x: number; y: number } | null>(null);
  const [editing, setEditing] = useState<{ id: string; x: number; y: number; width: number; height: number; text: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pinchRef = useRef<{ dist: number; cx: number; cy: number; origX: number; origY: number; origScale: number } | null>(null);
  const didPanRef = useRef(false);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; canvasX: number; canvasY: number; targetId: string | null } | null>(null);
  const [commentDraft, setCommentDraft] = useState<{ x: number; y: number; elementId: string | null } | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  async function confirmDeleteCurrentBoard() {
    setDeleteModalOpen(false);
    await api(`/api/boards/${boardId}`, {
      method: "DELETE",
    });
    router.push("/dashboard");
  }

  function handleZoomIn() {
    setViewport((v) => ({ ...v, scale: Math.min(3, Number((v.scale * 1.2).toFixed(2))) }));
  }

  function handleZoomOut() {
    setViewport((v) => ({ ...v, scale: Math.max(0.2, Number((v.scale / 1.2).toFixed(2))) }));
  }

  function handleResetZoom() {
    setViewport({ x: 0, y: 0, scale: 1 });
  }

  function handleFitCanvas() {
    if (elementsArray.length === 0) {
      setViewport({ x: 0, y: 0, scale: 1 });
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of elementsArray) {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    }
    const width = maxX - minX || 800;
    const height = maxY - minY || 600;
    const scale = Math.min(1.5, Math.max(0.3, Math.min(window.innerWidth / (width + 200), window.innerHeight / (height + 200))));
    setViewport({ x: minX - 100, y: minY - 100, scale: Number(scale.toFixed(2)) });
  }

  function bringToFront(id: string) {
    const el = elementsArray.find((item) => item.id === id);
    if (!el) return;
    const maxZ = Math.max(0, ...elementsArray.map((item) => item.zIndex ?? 0));
    upsertElement({ ...el, zIndex: maxZ + 1 });
  }

  function sendToBack(id: string) {
    const el = elementsArray.find((item) => item.id === id);
    if (!el) return;
    const minZ = Math.min(0, ...elementsArray.map((item) => item.zIndex ?? 0));
    upsertElement({ ...el, zIndex: minZ - 1 });
  }

  function duplicateElement(id: string) {
    const el = elementsArray.find((item) => item.id === id);
    if (!el) return;
    const newId = crypto.randomUUID();
    const clone = {
      ...el,
      id: newId,
      x: el.x + 20,
      y: el.y + 20,
      zIndex: elementsArray.length + 1,
      updatedAt: Date.now(),
    };
    upsertElement(clone);
    setSelectedId(newId);
  }

  const elements = useStorage((root) => root.elements);
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();
  const undo = useUndo();
  const redo = useRedo();
  const { theme } = useTheme();
  const defaultStroke = theme === "dark" ? "#e8eaf2" : "#151b31";
  const [penColor, setPenColor] = useState(defaultStroke);
  const [penStyle, setPenStyle] = useState<"solid" | "dashed" | "dotted">("solid");

  const elementsArray = useMemo(() => Array.from(elements.values()), [elements]);

  const addElement = useMutation(({ storage }, element: ShapeData) => {
    storage.get("elements").set(element.id, new LiveObject(element));
  }, []);

  const removeElement = useMutation(({ storage }, id: string) => {
    storage.get("elements").delete(id);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUser) {
      router.replace("/sign-in");
      return;
    }
    async function boot() {
      const data = await api<{ board: BoardRecord; role: BoardRole }>(
        `/api/boards/${boardId}`,
      );
      setBoard(data.board);
      setRole(data.role);
      recordRecentBoard(data.board);
    }
    void boot();
  }, [boardId, clerkUser, isLoaded, router]);

  function removeEl(elementId: string) {
    if (canEdit) removeElement(elementId);
  }

  function deleteSelectedElements() {
    if (!canEdit) return;
    const toDelete = new Set<string>();
    if (selectedId) toDelete.add(selectedId);
    selectedIds.forEach((id) => toDelete.add(id));

    if (toDelete.size > 0) {
      toDelete.forEach((id) => removeEl(id));
      setSelectedId(null);
      setSelectedIds(new Set());
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      if (event.code === "Space" && !event.repeat) {
        setIsSpacePressed(true);
        event.preventDefault();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && !event.altKey) {
        if (event.key === "z" && !event.shiftKey) {
          event.preventDefault();
          undo();
          return;
        }
        if (event.key === "z" && event.shiftKey) {
          event.preventDefault();
          redo();
          return;
        }
        if (event.key === "y") {
          event.preventDefault();
          redo();
          return;
        }
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        if (canEdit && !editing) {
          deleteSelectedElements();
          event.preventDefault();
        }
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const next = toolFromShortcut(event.key);
      if (next && canEdit) {
        if (editing) {
          const el = elementsArray.find((item) => item.id === editing.id);
          if (el) upsertElement({ ...el, text: editing.text });
          setEditing(null);
        }
        setTool(next);
        event.preventDefault();
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") {
        setIsSpacePressed(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [canEdit, undo, redo, selectedId, selectedIds, editing, elementsArray]);

  useEffect(() => {
    function onWheel(evt: Event) {
      const event = evt as WheelEvent;
      const target = event.target as HTMLElement | Element | null;
      if (target && target.closest("aside, [data-side-panel]")) {
        return;
      }

      const container = containerRef.current || svgRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!isInside) return;

      event.preventDefault();

      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;

      if (event.ctrlKey || event.metaKey) {
        // Pinch-to-zoom (Trackpad pinch or Ctrl + Scroll wheel)
        const factor = event.deltaMode === 1 ? 0.05 : event.deltaMode === 2 ? 1 : 0.005;
        const delta = -event.deltaY * factor;

        setViewport((vp) => {
          const worldX = (mx - vp.x) / vp.scale;
          const worldY = (my - vp.y) / vp.scale;
          const newScale = clamp(vp.scale * Math.pow(2, delta), 0.15, 5);
          return {
            scale: newScale,
            x: mx - worldX * newScale,
            y: my - worldY * newScale,
          };
        });
      } else {
        // Two-finger trackpad panning / scroll wheel panning
        let dx = event.deltaX;
        let dy = event.deltaY;

        if (event.deltaMode === 1) {
          // DOM_DELTA_LINE
          dx *= 24;
          dy *= 24;
        } else if (event.deltaMode === 2) {
          // DOM_DELTA_PAGE
          dx *= container.clientWidth;
          dy *= container.clientHeight;
        }

        if (event.shiftKey && dx === 0 && dy !== 0) {
          dx = dy;
          dy = 0;
        }

        setViewport((vp) => ({
          scale: vp.scale,
          x: vp.x - dx,
          y: vp.y - dy,
        }));
      }
    }

    function preventGesture(evt: Event) {
      const target = evt.target as HTMLElement | Element | null;
      if (target && target.closest("aside, [data-side-panel]")) return;
      const container = containerRef.current || svgRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const me = evt as MouseEvent;
      if (me.clientX >= rect.left && me.clientX <= rect.right && me.clientY >= rect.top && me.clientY <= rect.bottom) {
        evt.preventDefault();
      }
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("gesturestart", preventGesture, { passive: false });
    window.addEventListener("gesturechange", preventGesture, { passive: false });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("gesturestart", preventGesture);
      window.removeEventListener("gesturechange", preventGesture);
    };
  }, []);

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) continue;

          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (!dataUrl) return;

            const id = crypto.randomUUID();
            const cx = viewport.x + (window.innerWidth / 2) * viewport.scale;
            const cy = viewport.y + (window.innerHeight / 2) * viewport.scale;

            const img = new window.Image();
            img.onload = () => {
              const aspect = img.width / img.height || 4 / 3;
              const w = Math.min(400, Math.max(150, img.width));
              const h = w / aspect;

              upsertElement({
                id,
                boardId,
                type: "image",
                x: cx - w / 2,
                y: cy - h / 2,
                width: w,
                height: h,
                rotation: 0,
                fill: "#ffffff",
                stroke: "#151b31",
                strokeStyle: "solid",
                text: dataUrl,
                textAlign: "left",
                fromId: null,
                toId: null,
                cx: 0,
                cy: 0,
                zIndex: elementsArray.length + 1,
                updatedAt: Date.now(),
              });
              setSelectedId(id);
              setSelectedIds(new Set([id]));
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
          event.preventDefault();
          return;
        }
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [boardId, canEdit, viewport, elementsArray]);

  const selected = elementsArray.find((item) => item.id === selectedId) ?? null;

  const selectedElements = useMemo(() => {
    const ids = new Set(selectedIds);
    if (selectedId) ids.add(selectedId);
    return elementsArray.filter((el) => ids.has(el.id));
  }, [elementsArray, selectedId, selectedIds]);

  const selectionBounds = useMemo(() => {
    if (selectedElements.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of selectedElements) {
      if (el.type === "line" || el.type === "arrow") {
        minX = Math.min(minX, el.x, el.width);
        minY = Math.min(minY, el.y, el.height);
        maxX = Math.max(maxX, el.x, el.width);
        maxY = Math.max(maxY, el.y, el.height);
      } else {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + (el.width || 0));
        maxY = Math.max(maxY, el.y + (el.height || 0));
      }
    }
    return { minX, minY, maxX, maxY };
  }, [selectedElements]);

  function point(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    return {
      x: (screenX - viewport.x) / viewport.scale,
      y: (screenY - viewport.y) / viewport.scale,
    };
  }

  function screenPoint(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function upsertElement(element: ShapeData) {
    if (canEdit) addElement(element);
  }

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    event.preventDefault();

    if (editing) {
      const el = elementsArray.find((item) => item.id === editing.id);
      if (el) upsertElement({ ...el, text: editing.text });
      setEditing(null);
    }

    if (event.button === 1 || event.button === 2 || isSpacePressed || tool === "hand") {
      const sp = screenPoint(event);
      panRef.current = { startX: sp.x, startY: sp.y, origX: viewport.x, origY: viewport.y };
      didPanRef.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      if (pts[0] && pts[1]) {
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const cx = (pts[0].x + pts[1].x) / 2;
        const cy = (pts[0].y + pts[1].y) / 2;
        pinchRef.current = { dist, cx, cy, origX: viewport.x, origY: viewport.y, origScale: viewport.scale };
        return;
      }
    }

    if (pointersRef.current.size > 1) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const p = point(event);
    updateMyPresence({ cursor: { x: p.x, y: p.y } });
    if (!canEdit) return;

    if (tool === "eraser") {
      const hit = hitTestEraser(elementsArray, p);
      if (hit) {
        removeEl(hit.id);
        if (selectedId === hit.id) setSelectedId(null);
        setSelectedIds((current) => {
          const next = new Set(current);
          next.delete(hit.id);
          return next;
        });
      }
      return;
    }

    if (tool === "select") {
      const hit = hitTest(elementsArray, p);
      if (hit) {
        let activeSet = new Set(selectedIds);
        if (event.shiftKey) {
          if (activeSet.has(hit.id)) {
            activeSet.delete(hit.id);
          } else {
            activeSet.add(hit.id);
          }
        } else {
          if (!activeSet.has(hit.id)) {
            activeSet = new Set([hit.id]);
          }
        }
        setSelectedIds(activeSet);
        setSelectedId(activeSet.has(hit.id) ? hit.id : Array.from(activeSet)[0] ?? null);

        const initials = elementsArray
          .filter((item) => activeSet.has(item.id))
          .map((item) => ({
            id: item.id,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            cx: item.cx,
            cy: item.cy,
            type: item.type,
            text: item.text,
          }));

        drag.current = {
          startX: p.x,
          startY: p.y,
          initials,
        };
      } else {
        if (!event.shiftKey) {
          setSelectedId(null);
          setSelectedIds(new Set());
        }
        marqueeRef.current = p;
        setPreview({ kind: "marquee", x1: p.x, y1: p.y, x2: p.x, y2: p.y });
      }
      return;
    }

    if (tool === "pen") {
      penStroke.current = { points: [p] };
      setPreview({ kind: "path", d: `M ${p.x} ${p.y}` });
      return;
    }

    if (tool === "connector") {
      const hit = hitTest(elementsArray, p);
      if (!hit) return;
      if (!connectorFrom.current) {
        connectorFrom.current = hit.id;
        return;
      }
      upsertElement({
        id: crypto.randomUUID(),
        boardId,
        type: "connector",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
        fill: "#ffffff",
        stroke: defaultStroke,
        strokeStyle: "solid",
        text: "",
        textAlign: "left",
        fromId: connectorFrom.current,
        toId: hit.id,
        cx: 0,
        cy: 0,
        zIndex: elementsArray.length + 1,
        updatedAt: Date.now(),
      });
      connectorFrom.current = null;
      setTool("select");
      return;
    }

    const elType = toolToElementType(tool);
    if (!elType) return;
    draft.current = { type: elType, x: p.x, y: p.y };
    if (elType === "line" || elType === "arrow") {
      setPreview({ kind: "line", x1: p.x, y1: p.y, x2: p.x, y2: p.y });
    }
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    event.preventDefault();

    if (pointersRef.current.has(event.pointerId)) {
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values());
      if (pts[0] && pts[1]) {
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const cx = (pts[0].x + pts[1].x) / 2;
        const cy = (pts[0].y + pts[1].y) / 2;

        const scaleFactor = dist / (pinchRef.current.dist || 1);
        const dx = cx - pinchRef.current.cx;
        const dy = cy - pinchRef.current.cy;

        const container = containerRef.current || svgRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const mx = pinchRef.current.cx - rect.left;
          const my = pinchRef.current.cy - rect.top;

          setViewport(() => {
            const newScale = clamp(pinchRef.current!.origScale * scaleFactor, 0.15, 5);
            const worldX = (mx - pinchRef.current!.origX) / pinchRef.current!.origScale;
            const worldY = (my - pinchRef.current!.origY) / pinchRef.current!.origScale;

            return {
              scale: newScale,
              x: mx - worldX * newScale + dx,
              y: my - worldY * newScale + dy,
            };
          });
        }
        return;
      }
    }

    if (pointersRef.current.size > 1) return;

    if (panRef.current) {
      const { startX, startY, origX, origY } = panRef.current;
      const sp = screenPoint(event);
      const dx = sp.x - startX;
      const dy = sp.y - startY;
      if (Math.hypot(dx, dy) > 3) {
        didPanRef.current = true;
      }
      setViewport((current) => ({
        ...current,
        x: origX + dx,
        y: origY + dy,
      }));
      return;
    }

    const p = point(event);
    updateMyPresence({ cursor: { x: p.x, y: p.y } });

    if (marqueeRef.current) {
      setPreview({
        kind: "marquee",
        x1: marqueeRef.current.x,
        y1: marqueeRef.current.y,
        x2: p.x,
        y2: p.y,
      });
      return;
    }

    if (penStroke.current) {
      const pts = penStroke.current.points;
      const last = pts[pts.length - 1];
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 2) {
        pts.push(p);
        setPreview({
          kind: "path",
          d: pts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" "),
        });
      }
      return;
    }

    if (tool === "eraser" && canEdit && event.buttons > 0) {
      const hit = hitTestEraser(elementsArray, p);
      if (hit) {
        removeEl(hit.id);
        if (selectedId === hit.id) setSelectedId(null);
        setSelectedIds((current) => {
          const next = new Set(current);
          next.delete(hit.id);
          return next;
        });
      }
      return;
    }

    if (drag.current) {
      const dx = p.x - drag.current.startX;
      const dy = p.y - drag.current.startY;
      for (const init of drag.current.initials) {
        const current = elementsArray.find((item) => item.id === init.id);
        if (!current) continue;
        if (current.type === "path") {
          const newX = init.x + dx;
          const newY = init.y + dy;
          const deltaX = newX - current.x;
          const deltaY = newY - current.y;
          const newD = translatePath(current.text, deltaX, deltaY);
          upsertElement({ ...current, x: newX, y: newY, text: newD });
        } else if (current.type === "line" || current.type === "arrow") {
          upsertElement({
            ...current,
            x: init.x + dx,
            y: init.y + dy,
            width: init.width + dx,
            height: init.height + dy,
            cx: init.cx + dx,
            cy: init.cy + dy,
          });
        } else {
          upsertElement({ ...current, x: init.x + dx, y: init.y + dy });
        }
      }
      return;
    }

    if (resize.current) {
      const el = elementsArray.find((item) => item.id === resize.current?.id);
      if (!el) return;
      const dx = (event.clientX - resize.current.startX) / viewport.scale;
      const dy = (event.clientY - resize.current.startY) / viewport.scale;
      const h = resize.current.handle;
      let newX = resize.current.origX;
      let newY = resize.current.origY;
      let newW = resize.current.origW;
      let newH = resize.current.origH;
      if (h.includes("e")) newW = Math.max(20, resize.current.origW + dx);
      if (h.includes("w")) { newW = Math.max(20, resize.current.origW - dx); newX = resize.current.origX + dx; }
      if (h.includes("s")) newH = Math.max(20, resize.current.origH + dy);
      if (h.includes("n")) { newH = Math.max(20, resize.current.origH - dy); newY = resize.current.origY + dy; }
      upsertElement({ ...el, x: newX, y: newY, width: newW, height: newH });
      return;
    }

    if (arrowJoint.current) {
      const el = elementsArray.find((item) => item.id === arrowJoint.current?.id);
      if (!el) return;
      const dx = (event.clientX - arrowJoint.current.startX) / viewport.scale;
      const dy = (event.clientY - arrowJoint.current.startY) / viewport.scale;
      if (arrowJoint.current.joint === "start") {
        upsertElement({ ...el, x: el.x + dx, y: el.y + dy });
      } else if (arrowJoint.current.joint === "end") {
        upsertElement({ ...el, width: el.width + dx, height: el.height + dy });
      } else {
        const newCx = el.cx + dx;
        const newCy = el.cy + dy;
        upsertElement({ ...el, cx: newCx, cy: newCy });
      }
      arrowJoint.current = { ...arrowJoint.current, startX: event.clientX, startY: event.clientY };
      return;
    }

    if (draft.current) {
      const { type, x, y } = draft.current;
      if (type === "line" || type === "arrow") {
        setPreview({ kind: "line", x1: x, y1: y, x2: p.x, y2: p.y });
      } else {
        setPreview({
          kind: "rect",
          x1: x,
          y1: y,
          x2: Math.max(x + 8, p.x),
          y2: Math.max(y + 8, p.y),
        });
      }
    }
  }

  function onPointerUp(event: React.PointerEvent<SVGSVGElement>) {
    pointersRef.current.delete(event.pointerId);
    event.currentTarget.releasePointerCapture(event.pointerId);
    panRef.current = null;
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
    event.preventDefault();
    const p = point(event);

    if (penStroke.current && penStroke.current.points.length > 1) {
      const d = penStroke.current.points
        .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
        .join(" ");
      upsertElement({
        id: crypto.randomUUID(),
        boardId,
        type: "path",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
        fill: "none",
        stroke: penColor,
        strokeStyle: penStyle,
        text: d,
        textAlign: "left",
        fromId: null,
        toId: null,
        cx: 0,
        cy: 0,
        zIndex: elementsArray.length + 1,
        updatedAt: Date.now(),
      });
    }
    penStroke.current = null;

    if (marqueeRef.current && preview?.kind === "marquee") {
      const rect = {
        x: Math.min(preview.x1, preview.x2),
        y: Math.min(preview.y1, preview.y2),
        width: Math.abs(preview.x2 - preview.x1),
        height: Math.abs(preview.y2 - preview.y1),
      };
      if (rect.width > 4 || rect.height > 4) {
        const ids = elementsArray.filter((el) => elementIntersectsRect(el, rect)).map((el) => el.id);
        setSelectedIds(new Set(ids));
        setSelectedId(ids[0] ?? null);
      }
      marqueeRef.current = null;
    }

    if (draft.current) {
      const { type, x, y } = draft.current;
      if (type === "line" || type === "arrow") {
        if (Math.hypot(p.x - x, p.y - y) > 4) {
          upsertElement({
            id: crypto.randomUUID(),
            boardId,
            type,
            x,
            y,
            width: p.x,
            height: p.y,
            rotation: 0,
            fill: "none",
            stroke: defaultStroke,
            strokeStyle: "solid",
            text: "",
            textAlign: "left",
            fromId: null,
            toId: null,
            cx: (x + p.x) / 2,
            cy: (y + p.y) / 2,
            zIndex: elementsArray.length + 1,
            updatedAt: Date.now(),
          });
        }
        setTool("select");
      } else {
        const defaultText = type === "text" ? "Label" : type === "sticky" ? "Note" : "";
        const measured = type === "text" ? measureText(defaultText) : null;
        const width = measured ? Math.max(measured.width, p.x - x) : Math.max(type === "text" ? 200 : 80, p.x - x);
        const height = measured ? Math.max(measured.height, p.y - y) : Math.max(48, p.y - y);
        const element: ShapeData = {
          id: crypto.randomUUID(),
          boardId,
          type,
          x,
          y,
          width,
          height,
          rotation: 0,
          fill: defaultFill(type),
          stroke: defaultStroke,
          strokeStyle: "solid",
          text: defaultText,
          textAlign: "left",
          fromId: null,
          toId: null,
          cx: 0,
          cy: 0,
          zIndex: elementsArray.length + 1,
          updatedAt: Date.now(),
        };
        upsertElement(element);
        setSelectedId(element.id);
        setTool("select");
      }
      draft.current = null;
    }

    drag.current = null;
    resize.current = null;
    arrowJoint.current = null;
    panRef.current = null;
    setPreview(null);
  }

  function onDoubleClick(event: React.MouseEvent<SVGSVGElement>) {
    if (tool !== "select" || !canEdit) return;
    const p = point(event as unknown as React.PointerEvent<SVGSVGElement>);
    const hit = hitTest(elementsArray, p);
    if (!hit) return;
    if (hit.type === "path" || hit.type === "line" || hit.type === "arrow" || hit.type === "connector") return;
    setSelectedId(hit.id);
    setSelectedIds(new Set([hit.id]));
    setEditing({ id: hit.id, x: hit.x, y: hit.y, width: hit.width, height: hit.height, text: hit.text });
  }

  useEffect(() => {
    if (editing) {
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        ta.selectionStart = ta.value.length;
        ta.selectionEnd = ta.value.length;
      }
    }
  }, [editing]);

  useEffect(() => {
    async function pollComments() {
      try {
        const data = await api<{ comments: CommentRecord[] }>(`/api/boards/${boardId}/comments`);
        setComments(data.comments);
      } catch {
        // silent sync retry
      }
    }
    void pollComments();
    const timer = setInterval(() => {
      void pollComments();
    }, 3000);
    return () => clearInterval(timer);
  }, [boardId]);

  async function openPanel(next: typeof panel) {
    setPanel(next);
    if (next === "share") {
      const data = await api<{ members: typeof members; invitations: InvitationRecord[] }>(
        `/api/boards/${boardId}/share`,
      );
      setMembers(data.members);
      setInvites(data.invitations);
    }
    if (next === "history") {
      const data = await api<{ versions: VersionRecord[] }>(`/api/boards/${boardId}/versions`);
      setVersions(data.versions);
    }
  }



  function exportBoard() {
    setExportModalOpen(true);
  }

  async function saveSnapshot(label: string) {
    await api(`/api/boards/${boardId}/versions`, {
      method: "POST",
      body: JSON.stringify({ label }),
    });
  }

  if (!isLoaded || !clerkUser || !board) {
    return <div className="grid min-h-screen place-items-center text-slate">Opening canvas…</div>;
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-ash-canvas select-none">
      <header className="pointer-events-none absolute left-0 right-0 top-3 z-30 flex items-center justify-between px-4">
        <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-warm-stone bg-paper-white/95 p-1.5 shadow-[var(--shadow-stone)] backdrop-blur-sm dark:border-border/60 dark:bg-card/90 dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
          <Logo compact />
          <EditableBoardTitle
            title={board.title}
            canEdit={canEdit}
            onSave={async (title) => {
              const data = await api<{ board: BoardRecord }>(`/api/boards/${boardId}`, {
                method: "PATCH",
                body: JSON.stringify({ title }),
              });
              setBoard(data.board);
            }}
          />
        </div>
        <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-warm-stone bg-paper-white/95 p-1.5 shadow-[var(--shadow-stone)] backdrop-blur-sm dark:border-border/60 dark:bg-card/90 dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
          <div className="mr-1 flex -space-x-2">
            {others.map(({ connectionId, info }) => (
              <span
                key={connectionId}
                title={info.name}
                className="relative grid h-8 w-8 place-items-center rounded-full text-[11px] font-semibold ring-2 ring-paper-white"
                style={{ background: info.color }}
              >
                {info.avatar ? (
                  <Image
                    src={info.avatar}
                    alt={info.name}
                    width={32}
                    height={32}
                    className="h-full w-full rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  info.name.slice(0, 2).toUpperCase()
                )}
              </span>
            ))}
          </div>

          <button
            type="button"
            title="Shapes"
            aria-label="Shapes"
            onClick={() => void openPanel("shapes")}
            className="flex h-10 w-10 items-center justify-center rounded-md text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground outline-none focus:outline-none focus-visible:outline-none focus:ring-0 border-0 shadow-none"
          >
            <Shapes className="h-5 w-5" />
          </button>
          
          <button
            type="button"
            title="AI Assistant"
            aria-label="AI Assistant"
            onClick={() => void openPanel("ai")}
            className="flex h-10 w-10 items-center justify-center rounded-md text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground outline-none focus:outline-none focus-visible:outline-none focus:ring-0 border-0 shadow-none"
          >
            <Sparkles className="h-5 w-5" />
          </button>

          <button
            type="button"
            title="Share Board"
            aria-label="Share Board"
            onClick={() => void openPanel("share")}
            className="flex h-10 w-10 items-center justify-center rounded-md text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground outline-none focus:outline-none focus-visible:outline-none focus:ring-0 border-0 shadow-none"
          >
            <Share2 className="h-5 w-5" />
          </button>

          <HamburgerMenu
            onOpenHistory={() => void openPanel("history")}
            onOpenExport={() => void exportBoard()}
            onDeleteBoard={() => setDeleteModalOpen(true)}
          />
        </div>
      </header>

      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 overflow-hidden touch-none select-none"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (!canEdit) return;

          const files = e.dataTransfer.files;
          if (!files || files.length === 0) return;

          const rect = containerRef.current?.getBoundingClientRect();
          const screenX = e.clientX - (rect?.left ?? 0);
          const screenY = e.clientY - (rect?.top ?? 0);
          const dropCanvasX = (screenX - viewport.x) / viewport.scale;
          const dropCanvasY = (screenY - viewport.y) / viewport.scale;

          for (const file of Array.from(files)) {
            if (file.type.startsWith("image/")) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string;
                if (!dataUrl) return;

                const id = crypto.randomUUID();
                const img = new window.Image();
                img.onload = () => {
                  const aspect = img.width / img.height || 4 / 3;
                  const w = Math.min(400, Math.max(150, img.width));
                  const h = w / aspect;

                  upsertElement({
                    id,
                    boardId,
                    type: "image",
                    x: dropCanvasX - w / 2,
                    y: dropCanvasY - h / 2,
                    width: w,
                    height: h,
                    rotation: 0,
                    fill: "#ffffff",
                    stroke: "#151b31",
                    strokeStyle: "solid",
                    text: dataUrl,
                    textAlign: "left",
                    fromId: null,
                    toId: null,
                    cx: 0,
                    cy: 0,
                    zIndex: elementsArray.length + 1,
                    updatedAt: Date.now(),
                  });
                  setSelectedId(id);
                  setSelectedIds(new Set([id]));
                };
                img.src = dataUrl;
              };
              reader.readAsDataURL(file);
            }
          }
        }}
      >
        <svg
          ref={svgRef}
          className="whiteboard-surface h-full w-full bg-[#fafafa] dark:bg-[#0a0a0a] touch-none"
          style={{
            cursor: panRef.current ? "grabbing" : (isSpacePressed || tool === "hand") ? "grab" : "default",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={onDoubleClick}
          onContextMenu={(e) => {
            e.preventDefault();
            if (didPanRef.current) {
              didPanRef.current = false;
              return;
            }
            const p = point(e as unknown as React.PointerEvent<SVGSVGElement>);
            setContextMenu({ x: e.clientX, y: e.clientY, canvasX: p.x, canvasY: p.y, targetId: null });
          }}
        >
          <defs>
            <pattern
              id="dot-grid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}
            >
              <circle cx="1" cy="1" r="1" fill={theme === "dark" ? "#333333" : "#d1d5db"} />
            </pattern>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L0,10 L10,5 z" fill={theme === "dark" ? "#e8eaf2" : "#151b31"} />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
          <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
            {elementsArray.map((element) => (
              <g
                key={element.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedId(element.id);
                  setSelectedIds(new Set([element.id]));
                  const p = point(e as unknown as React.PointerEvent<SVGSVGElement>);
                  setContextMenu({ x: e.clientX, y: e.clientY, canvasX: p.x, canvasY: p.y, targetId: element.id });
                }}
              >
                <Shape
                  element={element}
                  selected={selectedIds.has(element.id)}
                  others={elementsArray}
                  darkMode={theme === "dark"}
                />
              </g>
            ))}

            {/* Render Floating Comment Pins on Canvas */}
            {comments
              .filter((c) => !c.resolved && !c.parentId)
              .map((c) => {
                let pinX = c.x ?? 0;
                let pinY = c.y ?? 0;
                if (c.elementId) {
                  const el = elementsArray.find((item) => item.id === c.elementId);
                  if (el) {
                    pinX = el.x + el.width - 12;
                    pinY = el.y - 12;
                  }
                }
                const isActive = activeCommentId === c.id;

                return (
                  <g
                    key={`canvas-comment-pin-${c.id}`}
                    transform={`translate(${pinX} ${pinY})`}
                    className="cursor-pointer"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveCommentId(isActive ? null : c.id);
                    }}
                  >
                    <circle
                      cx={0}
                      cy={0}
                      r={16}
                      fill="#ffffff"
                      stroke="#e2e8f0"
                      strokeWidth={2}
                      className="shadow-md transition hover:scale-110"
                    />
                    {c.authorAvatar ? (
                      <image
                        href={c.authorAvatar}
                        x={-14}
                        y={-14}
                        width={28}
                        height={28}
                        clipPath="circle(14px at 14px 14px)"
                      />
                    ) : (
                      <circle cx={0} cy={0} r={14} fill="#151b31" />
                    )}
                    {!c.authorAvatar && (
                      <text
                        x={0}
                        y={4}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill="#ffffff"
                      >
                        {c.authorName.slice(0, 2).toUpperCase()}
                      </text>
                    )}
                  </g>
                );
              })}
            {preview?.kind === "path" ? (
              <path
                d={preview.d}
                fill="none"
                stroke={theme === "dark" ? "#e8eaf2" : "#151b31"}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.7}
              />
            ) : null}
            {preview?.kind === "line" ? (
              <line
                x1={preview.x1}
                y1={preview.y1}
                x2={preview.x2}
                y2={preview.y2}
                stroke={theme === "dark" ? "#e8eaf2" : "#151b31"}
                strokeWidth={2}
                strokeDasharray="6 4"
                opacity={0.7}
                markerEnd={tool === "arrow" ? "url(#arrow)" : undefined}
              />
            ) : null}
            {preview?.kind === "rect" ? (
              <rect
                x={Math.min(preview.x1, preview.x2)}
                y={Math.min(preview.y1, preview.y2)}
                width={Math.abs(preview.x2 - preview.x1)}
                height={Math.abs(preview.y2 - preview.y1)}
                fill="rgba(134,224,193,0.15)"
                stroke={theme === "dark" ? "#e8eaf2" : "#151b31"}
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
            ) : null}
            {preview?.kind === "marquee" ? (
              <rect
                x={Math.min(preview.x1, preview.x2)}
                y={Math.min(preview.y1, preview.y2)}
                width={Math.abs(preview.x2 - preview.x1)}
                height={Math.abs(preview.y2 - preview.y1)}
                fill="rgba(255,88,88,0.08)"
                stroke="#ff5858"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            ) : null}
            {others.map(({ connectionId, presence, info }) =>
              presence.cursor ? (
                <g
                  key={connectionId}
                  transform={`translate(${presence.cursor.x} ${presence.cursor.y})`}
                  style={{ transition: "transform 0.12s ease-out" }}
                  pointerEvents="none"
                >
                  <path d="M0 0 L0 16 L4 12 L8 20 L11 18 L7 11 L14 11 Z" fill={info.color} />
                  <text x="16" y="12" fontSize="11" fill={theme === "dark" ? "#e8eaf2" : "#151b31"}>
                    {info.name}
                  </text>
                </g>
              ) : null,
            )}
            {selectedIds.size > 1 && tool === "select" && Array.from(selectedIds).map((id) => {
              const el = elementsArray.find((item) => item.id === id);
              if (!el) return null;
              return (
                <rect
                  key={`multi-${id}`}
                  x={el.x - 2}
                  y={el.y - 2}
                  width={el.width + 4}
                  height={el.height + 4}
                  fill="none"
                  stroke="#ff5858"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  pointerEvents="none"
                />
              );
            })}
            {selected && canEdit && tool === "select" && (() => {
              const sel = elementsArray.find((el) => el.id === selectedId);
              if (!sel) return null;
              if (sel.type === "path") return null;
              if (sel.type === "line" || sel.type === "arrow") {
                const x1 = sel.x, y1 = sel.y, x2 = sel.width, y2 = sel.height;
                const hasCurve = sel.cx !== 0 || sel.cy !== 0;
                const cpx = hasCurve ? sel.cx : (x1 + x2) / 2;
                const cpy = hasCurve ? sel.cy : (y1 + y2) / 2;
                return (
                  <g>
                    {hasCurve ? (
                      <path d={`M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`} fill="none" stroke="#ff5858" strokeWidth={2} strokeDasharray="6 4" />
                    ) : (
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ff5858" strokeWidth={2} strokeDasharray="6 4" />
                    )}
                    <circle cx={x1} cy={y1} r={5} fill="#ff5858" stroke="#fff" strokeWidth={1.5} style={{ cursor: "move" }} onPointerDown={(e) => { e.stopPropagation(); arrowJoint.current = { id: sel.id, joint: "start", startX: e.clientX, startY: e.clientY }; }} />
                    <circle cx={cpx} cy={cpy} r={5} fill="#ff5858" stroke="#fff" strokeWidth={1.5} style={{ cursor: "move" }} onPointerDown={(e) => { e.stopPropagation(); arrowJoint.current = { id: sel.id, joint: "middle", startX: e.clientX, startY: e.clientY }; }} />
                    <circle cx={x2} cy={y2} r={5} fill="#ff5858" stroke="#fff" strokeWidth={1.5} style={{ cursor: "move" }} onPointerDown={(e) => { e.stopPropagation(); arrowJoint.current = { id: sel.id, joint: "end", startX: e.clientX, startY: e.clientY }; }} />
                    {hasCurve && <line x1={x1} y1={y1} x2={cpx} y2={cpy} stroke="#ff5858" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />}
                    {hasCurve && <line x1={cpx} y1={cpy} x2={x2} y2={y2} stroke="#ff5858" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />}
                  </g>
                );
              }
              const handles = [
                { id: "nw", x: sel.x, y: sel.y, cursor: "nw-resize" },
                { id: "n", x: sel.x + sel.width / 2, y: sel.y, cursor: "n-resize" },
                { id: "ne", x: sel.x + sel.width, y: sel.y, cursor: "ne-resize" },
                { id: "e", x: sel.x + sel.width, y: sel.y + sel.height / 2, cursor: "e-resize" },
                { id: "se", x: sel.x + sel.width, y: sel.y + sel.height, cursor: "se-resize" },
                { id: "s", x: sel.x + sel.width / 2, y: sel.y + sel.height, cursor: "s-resize" },
                { id: "sw", x: sel.x, y: sel.y + sel.height, cursor: "sw-resize" },
                { id: "w", x: sel.x, y: sel.y + sel.height / 2, cursor: "w-resize" },
              ];
              return (
                <g>
                  <rect x={sel.x - 1} y={sel.y - 1} width={sel.width + 2} height={sel.height + 2} fill="none" stroke="#ff5858" strokeWidth={1.5} strokeDasharray="6 4" />
                  {handles.map((h) => (
                    <rect
                      key={h.id}
                      x={h.x - 4}
                      y={h.y - 4}
                      width={8}
                      height={8}
                      fill="#fff"
                      stroke="#ff5858"
                      strokeWidth={1.5}
                      style={{ cursor: h.cursor }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        resize.current = {
                          id: sel.id,
                          handle: h.id,
                          startX: e.clientX,
                          startY: e.clientY,
                          origX: sel.x,
                          origY: sel.y,
                          origW: sel.width,
                          origH: sel.height,
                        };
                      }}
                    />
                  ))}
                </g>
              );
            })()}
          </g>
        </svg>

        {/* Floating Selection Toolbar on Canvas */}
        {selectionBounds && canEdit && tool === "select" && (() => {
          const cx = (selectionBounds.minX + selectionBounds.maxX) / 2;
          const screenX = cx * viewport.scale + viewport.x;
          const screenY = selectionBounds.minY * viewport.scale + viewport.y - 48;

          return (
            <div
              className="absolute z-30 flex items-center gap-1.5 rounded-xl border border-warm-stone bg-paper-white/95 p-1.5 shadow-lg backdrop-blur-md dark:border-border dark:bg-card/95 animate-in fade-in zoom-in-95 duration-100 select-none"
              style={{
                left: `${Math.max(16, screenX)}px`,
                top: `${Math.max(64, screenY)}px`,
                transform: "translateX(-50%)",
              }}
            >
              <button
                type="button"
                title="Delete selected (Backspace / Delete)"
                aria-label="Delete selected shapes"
                onClick={deleteSelectedElements}
                className="flex items-center gap-1.5 rounded-lg bg-coral-emphasis/10 px-2.5 py-1.5 text-xs font-semibold text-coral-emphasis transition hover:bg-coral-emphasis hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete{selectedElements.length > 1 ? ` (${selectedElements.length})` : ""}</span>
              </button>

              <div className="h-4 w-px bg-warm-stone/60 dark:bg-border/60" />

              <button
                type="button"
                title="Duplicate selected"
                onClick={() => {
                  selectedElements.forEach((el) => duplicateElement(el.id));
                }}
                className="rounded-lg p-1.5 text-inkwell-navy transition hover:bg-ash-canvas dark:text-foreground"
              >
                <Copy className="h-4 w-4" />
              </button>

              {selectedElements.length === 1 && selectedElements[0] && (
                <>
                  <button
                    type="button"
                    title="Bring to front"
                    onClick={() => bringToFront(selectedElements[0]!.id)}
                    className="rounded-lg p-1.5 text-slate transition hover:bg-ash-canvas dark:hover:text-foreground"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Send to back"
                    onClick={() => sendToBack(selectedElements[0]!.id)}
                    className="rounded-lg p-1.5 text-slate transition hover:bg-ash-canvas dark:hover:text-foreground"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          );
        })()}

        {/* Floating Active Comment Card Popover */}
        {activeCommentId && (() => {
          const activeComment = comments.find((c) => c.id === activeCommentId && !c.resolved);
          if (!activeComment) return null;
          let worldX = activeComment.x ?? 0;
          let worldY = activeComment.y ?? 0;
          if (activeComment.elementId) {
            const el = elementsArray.find((item) => item.id === activeComment.elementId);
            if (el) {
              worldX = el.x + el.width - 12;
              worldY = el.y - 12;
            }
          }
          const screenX = worldX * viewport.scale + viewport.x + 20;
          const screenY = worldY * viewport.scale + viewport.y - 10;

          const threadReplies = comments.filter((r) => r.parentId === activeComment.id && !r.resolved);

          return (
            <div
              className="absolute z-40 w-[300px] rounded-2xl border border-warm-stone bg-paper-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-border dark:bg-card animate-in fade-in zoom-in-95 duration-100 select-text"
              style={{ left: Math.max(10, Math.min(window.innerWidth - 320, screenX)), top: Math.max(10, Math.min(window.innerHeight - 220, screenY)) }}
            >
              {/* Header toolbar with resolve & action icons */}
              <div className="flex items-center justify-between border-b border-warm-stone/60 pb-2.5 dark:border-border/60">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Mark Resolved"
                    onClick={async () => {
                      const data = await api<{ comments: CommentRecord[] }>(`/api/boards/${boardId}/comments`, {
                        method: "POST",
                        body: JSON.stringify({ resolveId: activeComment.id }),
                      });
                      setComments(data.comments);
                      setActiveCommentId(null);
                    }}
                    className="flex items-center gap-1.5 rounded-full bg-ash-canvas px-2.5 py-1 text-[11px] font-semibold text-inkwell-navy transition hover:bg-warm-stone dark:bg-card dark:text-foreground"
                  >
                    <span className="h-2 w-2 rounded-full bg-slate" />
                    Resolve
                  </button>
                </div>
                <div className="flex items-center gap-1 text-slate">
                  <span className="h-3 w-3 rounded-full bg-[#151b31] border border-white" />
                  <span className="h-3 w-3 rounded-full bg-[#86e0c1]" />
                  <span className="h-3 w-3 rounded-full bg-[#ff5858]" />
                  <button
                    type="button"
                    className="text-xs font-bold text-slate hover:text-foreground ml-2"
                    onClick={() => setActiveCommentId(null)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Author header & content */}
              <div className="pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      {activeComment.authorAvatar ? (
                        <img src={activeComment.authorAvatar} alt={activeComment.authorName} className="h-full w-full object-cover" />
                      ) : (
                        <AvatarFallback className="bg-inkwell-navy text-[9px] font-bold text-paper-white">
                          {activeComment.authorName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-[13px] font-semibold text-inkwell-navy dark:text-foreground">
                      {activeComment.authorName}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate">{formatCommentTime(activeComment.createdAt)}</span>
                </div>

                <p className="mt-2 text-[13px] leading-relaxed text-inkwell-navy dark:text-foreground">
                  {activeComment.content}
                </p>
              </div>

              {/* Replies list */}
              {threadReplies.length > 0 && (
                <div className="mt-3 grid gap-2 border-t border-warm-stone/60 pt-2.5 dark:border-border/60">
                  {threadReplies.map((reply) => (
                    <div key={reply.id} className="grid gap-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] font-semibold text-inkwell-navy dark:text-foreground">{reply.authorName}</span>
                        <span className="text-[9.5px] text-slate">{formatCommentTime(reply.createdAt)}</span>
                      </div>
                      <p className="text-[12px] text-inkwell-navy/90 dark:text-foreground/90">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              <form
                className="mt-3 flex items-center gap-2 rounded-xl border border-warm-stone bg-ash-canvas/40 px-2.5 py-1.5 dark:border-border dark:bg-card/50"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const input = (e.currentTarget.elements.namedItem("replyText") as HTMLInputElement).value;
                  if (!input.trim()) return;
                  const data = await api<{ comments: CommentRecord[] }>(`/api/boards/${boardId}/comments`, {
                    method: "POST",
                    body: JSON.stringify({
                      content: input,
                      elementId: activeComment.elementId,
                      parentId: activeComment.id,
                      x: activeComment.x,
                      y: activeComment.y,
                    }),
                  });
                  setComments(data.comments);
                  e.currentTarget.reset();
                }}
              >
                <input
                  name="replyText"
                  type="text"
                  placeholder="Leave a reply. Use @ to mention."
                  className="w-full bg-transparent text-[12px] outline-none placeholder:text-slate"
                />
                <button type="submit" title="Send Reply" className="text-slate hover:text-inkwell-navy dark:hover:text-foreground">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          );
        })()}

        {/* Floating Draft Comment Input Box Popover */}
        {commentDraft && (() => {
          const screenX = commentDraft.x * viewport.scale + viewport.x + 15;
          const screenY = commentDraft.y * viewport.scale + viewport.y - 10;
          return (
            <div
              className="absolute z-40 w-[280px] rounded-2xl border border-warm-stone bg-paper-white/95 p-3 shadow-xl backdrop-blur-md dark:border-border dark:bg-card animate-in fade-in zoom-in-95 duration-100 select-text"
              style={{ left: Math.max(10, Math.min(window.innerWidth - 300, screenX)), top: Math.max(10, Math.min(window.innerHeight - 150, screenY)) }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate uppercase tracking-wider">New Comment</span>
                <button
                  type="button"
                  className="text-xs text-slate hover:text-foreground"
                  onClick={() => setCommentDraft(null)}
                >
                  ✕
                </button>
              </div>
              <form
                className="flex flex-col gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const input = (e.currentTarget.elements.namedItem("commentContent") as HTMLInputElement).value;
                  if (!input.trim()) return;
                  const data = await api<{ comments: CommentRecord[] }>(`/api/boards/${boardId}/comments`, {
                    method: "POST",
                    body: JSON.stringify({
                      content: input,
                      elementId: commentDraft.elementId,
                      x: commentDraft.x,
                      y: commentDraft.y,
                    }),
                  });
                  setComments(data.comments);
                  setCommentDraft(null);
                }}
              >
                <input
                  name="commentContent"
                  autoFocus
                  type="text"
                  placeholder="Write a comment..."
                  className="w-full rounded-xl border border-warm-stone p-2 text-[13px] outline-none focus:ring-1 focus:ring-inkwell-navy dark:border-border dark:bg-card"
                />
                <div className="flex justify-end gap-1.5">
                  <ShadButton type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCommentDraft(null)}>
                    Cancel
                  </ShadButton>
                  <ShadButton type="submit" size="sm" className="h-7 px-3 text-xs bg-inkwell-navy text-paper-white">
                    Post
                  </ShadButton>
                </div>
              </form>
            </div>
          );
        })()}

        <ToolDock
          tool={tool}
          onTool={(t) => {
            if (editing) {
              const el = elementsArray.find((item) => item.id === editing.id);
              if (el) upsertElement({ ...el, text: editing.text });
              setEditing(null);
            }
            setTool(t);
          }}
          canEdit={canEdit}
        />

        {editing && (() => {
          const el = elementsArray.find((item) => item.id === editing.id);
          const pretextLayout = computePretextLayout(editing.text, editing.width, editing.height);
          const align = el?.textAlign ?? "left";
          return (
            <textarea
              ref={textareaRef}
              className="absolute z-30 overflow-hidden border-none bg-transparent p-2 outline-none shadow-none"
              style={{
                left: (editing.x + 8) * viewport.scale + viewport.x,
                top: (editing.y + 8) * viewport.scale + viewport.y,
                width: Math.max(10, editing.width - 16) * viewport.scale,
                height: Math.max(10, editing.height - 16) * viewport.scale,
                fontSize: `${pretextLayout.fontSize * viewport.scale}px`,
                lineHeight: `${pretextLayout.lineHeight * viewport.scale}px`,
                textAlign: align,
                fontFamily: "Inter, system-ui, sans-serif",
                resize: "none",
                color: theme === "dark" ? "#e8eaf2" : "#151b31",
                display: "flex",
                alignItems: "center",
              }}
              value={editing.text}
              onChange={(e) => {
                const val = e.target.value;
                setEditing((prev) => (prev ? { ...prev, text: val } : null));
                if (el) upsertElement({ ...el, text: val });
              }}
              onBlur={() => {
                if (!editing) return;
                if (el) {
                  if (el.type === "text") {
                    const measured = measureText(editing.text);
                    upsertElement({ ...el, text: editing.text, width: Math.max(el.width, measured.width), height: Math.max(el.height, measured.height) });
                  } else {
                    upsertElement({ ...el, text: editing.text });
                  }
                }
                setEditing(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setEditing(null);
                }
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  e.stopPropagation();
                  textareaRef.current?.blur();
                }
              }}
            />
          );
        })()}

        {tool === "pen" && canEdit && (
          <Card className="absolute left-4 top-4 w-[200px] ring-1 ring-foreground/10 shadow-lg">
            <CardContent className="grid gap-3 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate">Pen Options</p>
              <div className="grid grid-cols-5 gap-1.5">
                {["#151b31", "#e8eaf2", "#ff5858", "#86e0c1", "#fedf89"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-7 w-7 rounded-lg border transition hover:scale-105 ${penColor === color ? "border-2 border-mint-pulse" : "border-warm-stone"}`}
                    style={{ background: color }}
                    title={color}
                    onClick={() => setPenColor(color)}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                {(["solid", "dashed", "dotted"] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    className={`flex-1 rounded-lg border px-2 py-1 text-[11px] transition ${penStyle === style ? "bg-inkwell-navy text-paper-white" : "border-warm-stone text-inkwell-navy hover:bg-ash-canvas"}`}
                    onClick={() => setPenStyle(style)}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selected && canEdit ? (
          <Card className="absolute left-4 top-20 z-20 w-[280px] ring-1 ring-foreground/10 shadow-lg bg-paper-white/95 backdrop-blur-md dark:bg-card/95">
            <CardContent className="grid gap-3 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate">
                  {selected.type.toUpperCase()} OPTIONS
                </p>
                <button
                  type="button"
                  className="text-xs text-slate hover:text-foreground"
                  onClick={() => setSelectedId(null)}
                >
                  ✕
                </button>
              </div>

              {/* Text content edit (for text, sticky, shapes) */}
              {selected.type !== "path" && selected.type !== "line" && selected.type !== "arrow" && selected.type !== "connector" && selected.type !== "image" && !editing && (
                <textarea
                  className="select-text w-full rounded-lg border border-warm-stone bg-paper-white p-2 text-sm text-inkwell-navy shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inkwell-navy dark:border-border dark:bg-card dark:text-foreground"
                  rows={2}
                  placeholder="Enter text..."
                  value={selected.text}
                  onChange={(event) => {
                    const newText = event.target.value;
                    if (selected.type === "text") {
                      const measured = measureText(newText);
                      upsertElement({ ...selected, text: newText, width: Math.max(selected.width, measured.width), height: Math.max(selected.height, measured.height) });
                    } else {
                      upsertElement({ ...selected, text: newText });
                    }
                  }}
                />
              )}

              {/* Text alignment for text & sticky */}
              {(selected.type === "text" || selected.type === "sticky" || selected.type === "rect" || selected.type === "ellipse" || selected.type === "diamond") && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate">Alignment</span>
                  <div className="flex gap-1">
                    {([
                      { value: "left" as const, icon: AlignLeft, label: "Left" },
                      { value: "center" as const, icon: AlignCenter, label: "Center" },
                      { value: "right" as const, icon: AlignRight, label: "Right" },
                    ]).map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        type="button"
                        title={label}
                        className={`flex h-7 w-7 items-center justify-center rounded border transition ${
                          (selected.textAlign ?? "left") === value
                            ? "border-inkwell-navy bg-inkwell-navy text-paper-white dark:bg-paper-white dark:text-inkwell-navy"
                            : "border-warm-stone text-slate hover:bg-ash-canvas"
                        }`}
                        onClick={() => upsertElement({ ...selected, textAlign: value })}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Size for text, sticky & shapes */}
              {(selected.type === "text" || selected.type === "sticky" || selected.type === "rect" || selected.type === "ellipse" || selected.type === "diamond") && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-slate">Text Size</span>
                  <div className="flex gap-1 items-center">
                    {[
                      { label: "S", size: 12 },
                      { label: "M", size: 16 },
                      { label: "L", size: 20 },
                      { label: "XL", size: 24 },
                      { label: "2XL", size: 32 },
                    ].map(({ label, size }) => (
                      <button
                        key={size}
                        type="button"
                        className={`h-7 px-2 text-[11px] font-semibold rounded border transition ${
                          (selected.fontSize ?? (selected.type === "text" ? 16 : 14)) === size
                            ? "border-inkwell-navy bg-inkwell-navy text-paper-white dark:bg-paper-white dark:text-inkwell-navy"
                            : "border-warm-stone text-slate hover:bg-ash-canvas"
                        }`}
                        onClick={() => upsertElement({ ...selected, fontSize: size })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Line style (solid / dashed / dotted) for paths & shapes */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate">Line Style</span>
                <div className="flex gap-1.5">
                  {(["solid", "dashed", "dotted"] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      className={`flex-1 rounded border px-2 py-1 text-[10px] transition ${
                        (selected.strokeStyle ?? "solid") === style
                          ? "bg-inkwell-navy text-paper-white dark:bg-paper-white dark:text-inkwell-navy"
                          : "border-warm-stone text-slate hover:bg-ash-canvas"
                      }`}
                      onClick={() => upsertElement({ ...selected, strokeStyle: style })}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color choices for Stroke / Line */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-slate">Color Palette</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {FILL_PALETTE.slice(0, 12).map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="h-6 w-6 rounded-md border border-warm-stone transition hover:scale-105"
                      style={{ background: color }}
                      title={color}
                      onClick={() => {
                        if (selected.type === "path" || selected.type === "line" || selected.type === "arrow") {
                          upsertElement({ ...selected, stroke: color });
                        } else {
                          upsertElement({ ...selected, fill: color });
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                variant="danger"
                onClick={deleteSelectedElements}
              >
                {selectedElements.length > 1 ? `Delete ${selectedElements.length} Elements` : "Delete Element"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <ZoomControls
          zoom={viewport.scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onFitCanvas={handleFitCanvas}
        />

        {contextMenu ? (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            targetId={contextMenu.targetId}
            selectedCount={selectedElements.length}
            onAddComment={(targetId) => {
              if (contextMenu) {
                setCommentDraft({
                  x: contextMenu.canvasX,
                  y: contextMenu.canvasY,
                  elementId: targetId || null,
                });
              }
            }}
            onBringToFront={() => {
              selectedElements.forEach((el) => bringToFront(el.id));
            }}
            onSendToBack={() => {
              selectedElements.forEach((el) => sendToBack(el.id));
            }}
            onDuplicate={() => {
              selectedElements.forEach((el) => duplicateElement(el.id));
            }}
            onDelete={deleteSelectedElements}
            onClose={() => setContextMenu(null)}
          />
        ) : null}


      </div>

      {panel !== "none" ? (
        <BoardSidePanel panel={panel} onClose={() => setPanel("none")}>
          {panel === "share" ? (
            <SharePane
              members={members}
              invites={invites}
              canManage={role === "owner"}
              onInvite={async (email, inviteRole) => {
                const data = await api<{ members: typeof members; invitations: InvitationRecord[] }>(
                  `/api/boards/${boardId}/share`,
                  { method: "POST", body: JSON.stringify({ email, role: inviteRole }) },
                );
                setMembers(data.members);
                setInvites(data.invitations);
              }}
              onUpdateRole={async (userId, newRole) => {
                const data = await api<{ members: typeof members; invitations: InvitationRecord[] }>(
                  `/api/boards/${boardId}/share`,
                  { method: "POST", body: JSON.stringify({ updateUserId: userId, updateRole: newRole }) },
                );
                setMembers(data.members);
              }}
            />
          ) : null}
          {panel === "history" ? (
            <HistoryPane
              versions={versions}
              canRestore={role === "owner" || role === "editor"}
              onSave={async () => {
                await saveSnapshot("Manual snapshot");
              }}
              onRestore={async (versionId) => {
                await api(`/api/boards/${boardId}/versions`, {
                  method: "POST",
                  body: JSON.stringify({ restoreId: versionId }),
                });
              }}
            />
          ) : null}
          {panel === "shapes" ? (
            <ShapesPane
              onSelectShape={(shape) => {
                const def = getShapeDefinition(shape);
                const cx = viewport.x + (window.innerWidth / 2) * viewport.scale;
                const cy = viewport.y + (window.innerHeight / 2) * viewport.scale;
                upsertElement({
                  id: crypto.randomUUID(),
                  boardId,
                  type: def.type,
                  shapeId: shape,
                  x: cx - def.width / 2,
                  y: cy - def.height / 2,
                  width: def.width,
                  height: def.height,
                  rotation: 0,
                  fill: "#ffffff",
                  stroke: defaultStroke,
                  strokeStyle: "solid",
                  text: def.text || "",
                  textAlign: def.textAlign || "center",
                  fromId: null,
                  toId: null,
                  cx: 0,
                  cy: 0,
                  zIndex: elementsArray.length + 1,
                  updatedAt: Date.now(),
                });
              }}
            />
          ) : null}
          {panel === "ai" ? (
            <AiChatPane
              currentElements={elementsArray}
              onGenerate={(newElements: DiagramElementRecord[]) => {
                const idMap = new Map<string, string>();
                newElements.forEach((el) => {
                  idMap.set(el.id, crypto.randomUUID());
                });
                
                const generatedIds = new Set<string>();
                newElements.forEach((el) => {
                  const mappedId = idMap.get(el.id)!;
                  generatedIds.add(mappedId);
                  
                  const fromId = el.fromId && idMap.has(el.fromId) ? idMap.get(el.fromId)! : (el.fromId ?? null);
                  const toId = el.toId && idMap.has(el.toId) ? idMap.get(el.toId)! : (el.toId ?? null);

                  const toInsert: ShapeData = {
                    ...el,
                    id: mappedId,
                    boardId,
                    fromId,
                    toId,
                    strokeStyle: (el as unknown as ShapeData).strokeStyle ?? "solid",
                    cx: (el as unknown as ShapeData).cx ?? 0,
                    cy: (el as unknown as ShapeData).cy ?? 0,
                  };
                  
                  addElement(toInsert);
                });

                setSelectedId(null);
                setSelectedIds(generatedIds);
              }}
            />
          ) : null}
        </BoardSidePanel>
      ) : null}

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Permanently Delete Board?"
        description="This action cannot be undone. All shapes, drawings, and notes inside this board will be erased forever."
        confirmLabel="Delete Board"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => void confirmDeleteCurrentBoard()}
        onCancel={() => setDeleteModalOpen(false)}
      />

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        boardTitle={board.title}
        elements={elementsArray}
      />
    </div>
  );
}

function formatCommentTime(createdAt: number): string {
  const diffMs = Date.now() - createdAt;
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}



import { SharePane, HistoryPane, ShapesPane, AiChatPane } from "@/board/diagram/SidePanels";
