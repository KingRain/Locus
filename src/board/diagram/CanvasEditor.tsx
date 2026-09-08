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
  Download,
  History,
  LayoutDashboard,
  MessageSquare,
  Share2,
} from "@/components/icons";
import { Button, TextInput } from "@/components/locus-ui";
import { RoleBadge, TagBadge } from "@/components/tag-badge";
import { BoardSidePanel, PanelSection } from "@/board/diagram/BoardSidePanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button as ShadButton } from "@/components/ui/button";
import { ToolDock } from "@/board/diagram/ToolDock";
import { EditableBoardTitle } from "@/board/diagram/EditableBoardTitle";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { recordRecentBoard } from "@/lib/recent-boards";
import {
  center,
  clamp,
  elementIntersectsRect,
  FILL_PALETTE,
  hitTest,
  hitTestEraser,
  shapeEdgePoint,
} from "@/board/diagram/canvas-utils";
import { toolFromShortcut } from "@/board/diagram/tool-shortcuts";
import type {
  BoardRecord,
  BoardRole,
  CommentRecord,
  ElementType,
  InvitationRecord,
  Tool,
  VersionRecord,
} from "@/lib/types";

function defaultFill(type: string): string {
  if (type === "sticky") return "#fedf89";
  return "#ffffff";
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

function Shape({
  element,
  selected,
  others,
  darkMode,
}: {
  element: ShapeData;
  selected: boolean;
  others: ShapeData[];
  darkMode: boolean;
}) {
  const textColor = element.fill === "#151b31" ? "#ffffff" : darkMode ? "#e8eaf2" : "#151b31";
  let stroke = selected ? "#ff5858" : element.stroke;
  if (darkMode && stroke === "#151b31") {
    stroke = "#e8eaf2";
  }
  const strokeDasharray = element.strokeStyle === "dashed" ? "8 4" : element.strokeStyle === "dotted" ? "2 4" : undefined;
  const common = { fill: element.fill, stroke, strokeWidth: selected ? 3 : 2 };
  const lines = element.text.split("\n");

  if (element.type === "path") {
    return (
      <path
        d={element.text}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
      />
    );
  }

  if (element.type === "line" || element.type === "arrow") {
    const hasCurve = element.cx !== 0 || element.cy !== 0;
    if (hasCurve) {
      const d = `M ${element.x} ${element.y} Q ${element.cx} ${element.cy} ${element.width} ${element.height}`;
      return (
        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeDasharray={strokeDasharray}
          markerEnd={element.type === "arrow" ? "url(#arrow)" : undefined}
        />
      );
    }
    return (
      <line
        x1={element.x}
        y1={element.y}
        x2={element.width}
        y2={element.height}
        stroke={stroke}
        strokeWidth={2}
        strokeDasharray={strokeDasharray}
        markerEnd={element.type === "arrow" ? "url(#arrow)" : undefined}
      />
    );
  }

  if (element.type === "connector") {
    const from = others.find((item) => item.id === element.fromId);
    const to = others.find((item) => item.id === element.toId);
    if (!from || !to) return null;
    const fromCenter = center(from);
    const toCenter = center(to);
    const start = shapeEdgePoint(toCenter, from);
    const end = shapeEdgePoint(fromCenter, to);
    return (
      <g>
        <line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={stroke}
          strokeWidth={2}
          markerEnd="url(#arrow)"
        />
        {element.text ? (
          <text
            x={(start.x + end.x) / 2}
            y={(start.y + end.y) / 2 - 8}
            textAnchor="middle"
            fontSize="12"
            fill={darkMode ? "#e8eaf2" : "#151b31"}
          >
            {element.text}
          </text>
        ) : null}
      </g>
    );
  }

  if (element.type === "ellipse") {
    return (
      <g>
        <ellipse
          cx={element.x + element.width / 2}
          cy={element.y + element.height / 2}
          rx={element.width / 2}
          ry={element.height / 2}
          {...common}
        />
        <text
          x={element.x + element.width / 2}
          y={element.y + element.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fill={textColor}
        >
          {element.text}
        </text>
      </g>
    );
  }

  if (element.type === "diamond") {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;
    const points = `${cx},${element.y} ${element.x + element.width},${cy} ${cx},${element.y + element.height} ${element.x},${cy}`;
    return (
      <g>
        <polygon points={points} {...common} />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fill={textColor}
        >
          {element.text}
        </text>
      </g>
    );
  }

  if (element.type === "text") {
    return (
      <text x={element.x + 14} y={element.y + 26} fontSize="14" fill={textColor}>
        {lines.map((line, index) => (
          <tspan key={line + index} x={element.x + 14} dy={index === 0 ? 0 : 18}>
            {line}
          </tspan>
        ))}
      </text>
    );
  }

  return (
    <g>
      <rect
        x={element.x}
        y={element.y}
        width={element.width}
        height={element.height}
        rx={element.type === "sticky" ? 8 : 12}
        {...common}
      />
      <text x={element.x + 14} y={element.y + 26} fontSize="14" fill={textColor}>
        {lines.map((line, index) => (
          <tspan key={line + index} x={element.x + 14} dy={index === 0 ? 0 : 18}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

export function BoardWorkspace({ boardId }: { boardId: string }) {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [board, setBoard] = useState<BoardRecord | null>(null);
  const [role, setRole] = useState<BoardRole>("viewer");
  const [tool, setTool] = useState<Tool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [panel, setPanel] = useState<"none" | "comments" | "share" | "history">("none");
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [members, setMembers] = useState<{ name?: string; email?: string; role: string; userId: string }[]>([]);
  const [invites, setInvites] = useState<InvitationRecord[]>([]);
  const [preview, setPreview] = useState<{ kind: "line" | "rect"; x1: number; y1: number; x2: number; y2: number } | { kind: "path"; d: string } | { kind: "marquee"; x1: number; y1: number; x2: number; y2: number } | null>(null);

  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
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
  const viewportRef = useRef(viewport);

  useEffect(() => {
    viewportRef.current = viewport;
  });

  const canEdit = role === "owner" || role === "editor";

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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

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
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canEdit, undo, redo]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function onWheel(event: WheelEvent) {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const rect = svg!.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const vp = viewportRef.current;
      const worldX = (mx - vp.x) / vp.scale;
      const worldY = (my - vp.y) / vp.scale;
      const delta = -event.deltaY * 0.001;
      const newScale = clamp(vp.scale * (1 + delta), 0.25, 4);
      setViewport({
        scale: newScale,
        x: mx - worldX * newScale,
        y: my - worldY * newScale,
      });
    }

    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const selected = elementsArray.find((item) => item.id === selectedId) ?? null;

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

  function removeEl(elementId: string) {
    if (canEdit) removeElement(elementId);
  }

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    event.preventDefault();

    if (editing) {
      const el = elementsArray.find((item) => item.id === editing.id);
      if (el) upsertElement({ ...el, text: editing.text });
      setEditing(null);
    }

    if (event.button === 1) {
      const sp = screenPoint(event);
      panRef.current = { startX: sp.x, startY: sp.y, origX: viewport.x, origY: viewport.y };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

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
        setSelectedId(hit.id);
        setSelectedIds(new Set([hit.id]));
        drag.current = { id: hit.id, dx: p.x - hit.x, dy: p.y - hit.y };
      } else {
        setSelectedId(null);
        setSelectedIds(new Set());
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

    if (panRef.current) {
      const sp = screenPoint(event);
      const dx = sp.x - panRef.current.startX;
      const dy = sp.y - panRef.current.startY;
      setViewport((current) => ({
        ...current,
        x: panRef.current!.origX + dx,
        y: panRef.current!.origY + dy,
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
      const current = elementsArray.find((item) => item.id === drag.current?.id);
      if (!current) return;
      upsertElement({ ...current, x: p.x - drag.current.dx, y: p.y - drag.current.dy });
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
        const width = Math.max(type === "text" ? 200 : 80, p.x - x);
        const height = Math.max(type === "text" ? 48 : 48, p.y - y);
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
          text: type === "text" ? "Label" : type === "sticky" ? "Note" : "",
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

  async function openPanel(next: typeof panel) {
    setPanel(next);
    if (next === "comments") {
      const data = await api<{ comments: CommentRecord[] }>(`/api/boards/${boardId}/comments`);
      setComments(data.comments);
    }
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

  async function exportBoard() {
    const data = await api<{ svg: string }>(`/api/boards/${boardId}/export`, { method: "POST" });
    const blob = new Blob([data.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${board?.title ?? "board"}.svg`;
    link.click();
    URL.revokeObjectURL(url);
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
    <div className="flex h-screen flex-col bg-ash-canvas select-none">
      <header className="flex items-center justify-between border-b border-warm-stone bg-paper-white px-4 py-2.5 dark:border-border dark:bg-card/80">
        <div className="flex items-center gap-3">
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
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
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
          <Button variant="ghost" className="px-2.5 py-2" title="Comments" aria-label="Comments" onClick={() => void openPanel("comments")}>
            <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
          </Button>
          <Button variant="ghost" className="gap-1.5 px-3 py-2" onClick={() => void openPanel("share")}>
            <Share2 className="h-4 w-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button variant="ghost" className="px-2.5 py-2" title="History" aria-label="History" onClick={() => void openPanel("history")}>
            <History className="h-4 w-4" strokeWidth={1.75} />
          </Button>
          <Button variant="ghost" className="gap-1.5 px-3 py-2" onClick={() => void exportBoard()}>
            <Download className="h-4 w-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button href="/dashboard" variant="ghost" className="gap-1.5 px-3 py-2">
            <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <svg
          ref={svgRef}
          className="whiteboard-surface h-full w-full bg-[#fafafa] dark:bg-[#0a0a0a]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={onDoubleClick}
          onContextMenu={(event) => event.preventDefault()}
        >
          <defs>
            <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill={theme === "dark" ? "#333333" : "#d1d5db"} />
            </pattern>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L0,10 L10,5 z" fill={theme === "dark" ? "#e8eaf2" : "#151b31"} />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
          <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
            {elementsArray.map((element) => (
              <Shape
                key={element.id}
                element={element}
                selected={selectedIds.has(element.id)}
                others={elementsArray}
                darkMode={theme === "dark"}
              />
            ))}
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
                <g key={connectionId} transform={`translate(${presence.cursor.x} ${presence.cursor.y})`} pointerEvents="none">
                  <path d="M0 0 L0 16 L4 12 L8 20 L11 18 L7 11 L14 11 Z" fill={info.color} />
                  <text x="16" y="12" fontSize="11" fill={theme === "dark" ? "#e8eaf2" : "#151b31"}>
                    {info.name}
                  </text>
                </g>
              ) : null,
            )}
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

        <ToolDock tool={tool} onTool={(t) => { if (editing) { const el = elementsArray.find((item) => item.id === editing.id); if (el) upsertElement({ ...el, text: editing.text }); setEditing(null); } setTool(t); }} canEdit={canEdit} />

        {editing && (
          <textarea
            ref={textareaRef}
            className="absolute z-30 overflow-hidden border-none bg-transparent p-3 text-sm text-inherit outline-none"
            style={{
              left: (editing.x - viewport.x) * viewport.scale,
              top: (editing.y - viewport.y) * viewport.scale,
              width: editing.width * viewport.scale,
              height: editing.height * viewport.scale,
              lineHeight: "18px",
              fontFamily: "inherit",
              resize: "none",
              color: theme === "dark" ? "#e8eaf2" : "#151b31",
            }}
            value={editing.text}
            onChange={(e) => {
              setEditing((prev) => (prev ? { ...prev, text: e.target.value } : null));
              const ta = textareaRef.current;
              if (ta) {
                ta.style.height = "auto";
                ta.style.height = ta.scrollHeight + "px";
              }
            }}
            onBlur={() => {
              if (!editing) return;
              const el = elementsArray.find((item) => item.id === editing.id);
              if (el) upsertElement({ ...el, text: editing.text });
              setEditing(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                setEditing(null);
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                textareaRef.current?.blur();
              }
            }}
          />
        )}

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
          <Card className="absolute left-4 top-4 w-[280px] ring-1 ring-foreground/10 shadow-lg">
            <CardContent className="grid gap-3 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate">Selected shape</p>
              {!editing && (
                <TextInput
                  className="select-text"
                  value={selected.text}
                  onChange={(event) => upsertElement({ ...selected, text: event.target.value })}
                />
              )}
              <div className="grid grid-cols-6 gap-1.5">
                {FILL_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-7 w-7 rounded-lg border border-warm-stone transition hover:scale-105"
                    style={{ background: color }}
                    title={color}
                    onClick={() => upsertElement({ ...selected, fill: color })}
                  />
                ))}
              </div>
              <Button
                className="w-full"
                variant="danger"
                onClick={() => {
                  removeEl(selected.id);
                  setSelectedId(null);
                }}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {panel !== "none" ? (
        <BoardSidePanel panel={panel} onClose={() => setPanel("none")}>
          {panel === "comments" ? (
            <CommentsPane
              comments={comments}
              canComment={role !== "viewer"}
              onAdd={async (content) => {
                const data = await api<{ comments: CommentRecord[] }>(`/api/boards/${boardId}/comments`, {
                  method: "POST",
                  body: JSON.stringify({ content }),
                });
                setComments(data.comments);
              }}
              onResolve={async (id) => {
                const data = await api<{ comments: CommentRecord[] }>(`/api/boards/${boardId}/comments`, {
                  method: "POST",
                  body: JSON.stringify({ resolveId: id }),
                });
                setComments(data.comments);
              }}
            />
          ) : null}
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
        </BoardSidePanel>
      ) : null}
    </div>
  );
}

function CommentsPane({
  comments,
  canComment,
  onAdd,
  onResolve,
}: {
  comments: CommentRecord[];
  canComment: boolean;
  onAdd: (content: string) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  return (
    <div className="grid gap-4">
      {comments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-warm-stone bg-ash-canvas/50 px-4 py-6 text-center text-[13px] text-slate">
          No comments yet. Start a thread below.
        </p>
      ) : (
        comments.map((comment) => (
          <Card
            key={comment.id}
            className={`ring-1 ring-foreground/8 ${comment.resolved ? "bg-mint-pulse/10" : "bg-card"}`}
          >
            <CardContent className="grid gap-2 pt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-inkwell-navy text-[10px] text-paper-white">
                      {comment.authorName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-[13px] font-semibold">{comment.authorName}</p>
                </div>
                {comment.resolved ? <TagBadge tone="mint">Resolved</TagBadge> : null}
              </div>
              <p className="text-[14px] leading-relaxed text-inkwell-navy">{comment.content}</p>
              {canComment && !comment.resolved ? (
                <ShadButton
                  variant="ghost"
                  size="sm"
                  className="h-7 w-fit px-2 text-coral-emphasis hover:text-coral-emphasis"
                  onClick={() => void onResolve(comment.id)}
                >
                  Mark resolved
                </ShadButton>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
      {canComment ? (
        <PanelSection title="Add comment">
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!text.trim()) return;
              void onAdd(text);
              setText("");
            }}
          >
            <TextInput
              className="select-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Leave a note for the team"
            />
            <ShadButton type="submit" className="w-full">
              Post comment
            </ShadButton>
          </form>
        </PanelSection>
      ) : null}
    </div>
  );
}

function SharePane({
  members,
  invites,
  canManage,
  onInvite,
}: {
  members: { name?: string; email?: string; role: string; userId: string }[];
  invites: InvitationRecord[];
  canManage: boolean;
  onInvite: (email: string, role: BoardRole) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const pending = invites.filter((item) => item.status === "pending");

  return (
    <div className="grid gap-5">
      <PanelSection title="People with access">
        <ul className="grid gap-2">
          {members.map((member) => (
            <li key={member.userId}>
              <Card className="ring-1 ring-foreground/8">
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback className="bg-mint-pulse/40 text-[10px] font-semibold text-inkwell-navy">
                        {(member.name ?? member.email ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-[14px] font-medium">{member.name ?? member.email}</span>
                  </div>
                  <RoleBadge role={member.role} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </PanelSection>

      {pending.length > 0 ? (
        <PanelSection title="Pending invites">
          <ul className="grid gap-2">
            {pending.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between rounded-xl border border-dashed border-warm-stone bg-ash-canvas/60 px-3 py-2.5 text-[13px]"
              >
                <span className="truncate text-inkwell-navy">{invite.email}</span>
                <TagBadge tone="butter">{invite.role}</TagBadge>
              </li>
            ))}
          </ul>
        </PanelSection>
      ) : null}

      {canManage ? (
        <PanelSection title="Invite collaborator">
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void onInvite(email, "editor");
              setEmail("");
            }}
          >
            <Input
              className="select-text h-10 rounded-lg"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="colleague@school.edu"
              required
            />
            <ShadButton type="submit" className="w-full">
              Invite as editor
            </ShadButton>
          </form>
        </PanelSection>
      ) : null}
    </div>
  );
}

function HistoryPane({
  versions,
  canRestore,
  onSave,
  onRestore,
}: {
  versions: VersionRecord[];
  canRestore: boolean;
  onSave: () => Promise<void>;
  onRestore: (id: string) => Promise<void>;
}) {
  return (
    <div className="grid gap-4">
      <ShadButton onClick={() => void onSave()} className="w-full">
        Save snapshot
      </ShadButton>
      {versions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-warm-stone bg-ash-canvas/50 px-4 py-6 text-center text-[13px] text-slate">
          No snapshots yet. Save one to capture this moment.
        </p>
      ) : (
        versions.map((version) => (
          <Card key={version.id} className="ring-1 ring-foreground/8">
            <CardContent className="grid gap-2 py-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] font-semibold">{version.label}</p>
                <TagBadge tone="outline">Snapshot</TagBadge>
              </div>
              <p className="text-[12px] text-slate">{new Date(version.createdAt).toLocaleString()}</p>
              {canRestore ? (
                <ShadButton
                  variant="outline"
                  size="sm"
                  className="mt-1 w-fit"
                  onClick={() => void onRestore(version.id)}
                >
                  Restore version
                </ShadButton>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
