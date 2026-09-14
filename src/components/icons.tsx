import type { LucideIcon } from "lucide-react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Circle,
  Diamond,
  Download,
  Eraser,
  History,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Minus,
  MousePointer2,
  Pencil,
  PenLine,
  Search,
  Share2,
  Square,
  StickyNote,
  Type,
  Users,
  Wifi,
  WifiOff,
  Workflow,
  Database,
  Boxes,
  Network,
} from "lucide-react";
import type { TemplateKind, Tool } from "@/lib/types";

import { Image as ImageIcon, Layers, Hand } from "lucide-react";

export const TOOL_ICONS: Record<Tool, LucideIcon> = {
  select: MousePointer2,
  hand: Hand,
  pen: Pencil,
  rect: Square,
  ellipse: Circle,
  diamond: Diamond,
  text: Type,
  line: Minus,
  arrow: ArrowRight,
  connector: PenLine,
  sticky: StickyNote,
  eraser: Eraser,
  image: ImageIcon,
  group: Layers,
};

export const TEMPLATE_ICONS: Record<TemplateKind, LucideIcon> = {
  uml: Boxes,
  flowchart: Workflow,
  er: Database,
  architecture: Network,
};

export {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Circle,
  Download,
  History,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MessageSquare,
  PenLine,
  Search,
  Share2,
  Users,
  Wifi,
  WifiOff,
};
