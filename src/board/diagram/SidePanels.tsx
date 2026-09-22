"use client";

import { useState } from "react";
import { Send, Loader2, AlertCircle } from "lucide-react";
import { getShapeDefinition } from "@/board/diagram/shapes/shape-library";
import { PanelSection } from "@/board/diagram/BoardSidePanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button as ShadButton } from "@/components/ui/button";
import { RoleBadge, TagBadge } from "@/components/tag-badge";
import type { BoardRole, DiagramElementRecord, InvitationRecord, VersionRecord } from "@/lib/types";

export function SharePane({
  members,
  invites,
  canManage,
  onInvite,
  onUpdateRole,
}: {
  members: { name?: string; email?: string; role: string; userId: string; avatar?: string }[];
  invites: InvitationRecord[];
  canManage: boolean;
  onInvite: (email: string, role: BoardRole) => Promise<void>;
  onUpdateRole?: (userId: string, role: BoardRole) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<BoardRole>("editor");
  const pending = invites.filter((item) => item.status === "pending");

  return (
    <div className="grid gap-3.5">
      {canManage ? (
        <PanelSection title="Invite collaborator">
          <form
            className="grid gap-2.5"
            onSubmit={(event) => {
              event.preventDefault();
              void onInvite(email, inviteRole);
              setEmail("");
            }}
          >
            <Input
              className="select-text h-8 rounded-md text-xs"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="colleague@school.edu"
              required
            />

            {/* Role selector (Editor vs Viewer) */}
            <div className="flex rounded-md border border-warm-stone p-0.5 bg-ash-canvas/50 dark:border-border dark:bg-card/50">
              <button
                type="button"
                className={`flex-1 rounded py-1 text-[11px] font-semibold transition ${
                  inviteRole === "editor"
                    ? "bg-[#fef08a]/90 text-[#713f12] shadow-sm ring-1 ring-[#fde047] dark:bg-[#713f12]/70 dark:text-[#fef08a] dark:ring-[#a16207]"
                    : "text-slate hover:text-foreground hover:bg-[#fef08a]/20"
                }`}
                onClick={() => setInviteRole("editor")}
              >
                Editor
              </button>
              <button
                type="button"
                className={`flex-1 rounded py-1 text-[11px] font-semibold transition ${
                  inviteRole === "viewer"
                    ? "bg-[#fef08a]/90 text-[#713f12] shadow-sm ring-1 ring-[#fde047] dark:bg-[#713f12]/70 dark:text-[#fef08a] dark:ring-[#a16207]"
                    : "text-slate hover:text-foreground hover:bg-[#fef08a]/20"
                }`}
                onClick={() => setInviteRole("viewer")}
              >
                Viewer
              </button>
            </div>

            <ShadButton type="submit" size="sm" className="h-8 w-full rounded-md bg-inkwell-navy text-xs font-semibold text-paper-white hover:bg-[#713f12] dark:hover:bg-[#fef08a] dark:hover:text-[#713f12] transition-colors">
              Send Invite ({inviteRole === "editor" ? "Editor" : "Viewer"})
            </ShadButton>
          </form>
        </PanelSection>
      ) : null}

      <PanelSection title="People with access">
        <ul className="grid gap-1.5">
          {members.map((member) => (
            <li key={member.userId}>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-warm-stone/60 bg-paper-white px-3 py-2 dark:border-border/60 dark:bg-card hover:border-[#fde047]/50 transition-colors">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Avatar className="h-7 w-7 shrink-0 ring-1 ring-warm-stone/60">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name ?? member.email} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-ash-canvas text-[11px] font-bold text-inkwell-navy dark:bg-card dark:text-foreground">
                        {(member.name ?? member.email ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[13px] font-semibold text-inkwell-navy dark:text-foreground leading-tight break-all">
                      {member.name ?? member.email}
                    </span>
                    {member.name && member.email ? (
                      <span className="text-[11px] text-slate leading-tight break-all">{member.email}</span>
                    ) : null}
                  </div>
                </div>
                {canManage && member.role !== "owner" && onUpdateRole ? (
                  <select
                    className="h-6 rounded-md border border-warm-stone bg-paper-white px-1.5 text-[11px] font-semibold tracking-wide uppercase text-slate outline-none hover:bg-[#fef08a]/20 focus:ring-1 focus:ring-[#fde047] dark:border-border dark:bg-card dark:text-foreground"
                    value={member.role}
                    onChange={(e) => void onUpdateRole(member.userId, e.target.value as BoardRole)}
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <RoleBadge role={member.role} />
                )}
              </div>
            </li>
          ))}
        </ul>
      </PanelSection>

      {pending.length > 0 ? (
        <PanelSection title="Pending invites">
          <ul className="grid gap-1.5">
            {pending.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-warm-stone/80 bg-ash-canvas/60 px-3 py-2 text-[12px]"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="bg-butter-yellow/30 text-[9px] font-bold text-inkwell-navy">
                      {invite.email.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-inkwell-navy dark:text-foreground text-[12px] font-medium break-all">{invite.email}</span>
                </div>
                <TagBadge tone="butter" className="h-5 px-2 text-[9.5px] font-bold tracking-wide uppercase shrink-0 rounded-md">{invite.role}</TagBadge>
              </li>
            ))}
          </ul>
        </PanelSection>
      ) : null}
    </div>
  );
}

export function HistoryPane({
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
      <ShadButton onClick={() => void onSave()} className="w-full rounded-lg bg-inkwell-navy text-paper-white hover:bg-[#713f12] dark:hover:bg-[#fef08a] dark:hover:text-[#713f12] transition-colors">
        Save snapshot
      </ShadButton>
      {versions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-warm-stone bg-ash-canvas/50 px-4 py-6 text-center text-[13px] text-slate">
          No snapshots yet. Save one to capture this moment.
        </p>
      ) : (
        versions.map((version) => (
          <Card key={version.id} className="rounded-lg border border-warm-stone shadow-sm hover:border-[#fde047]/60 transition-colors">
            <CardContent className="grid gap-2 py-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] font-semibold">{version.label}</p>
                <TagBadge tone="butter">Snapshot</TagBadge>
              </div>
              <p className="text-[12px] text-slate">{new Date(version.createdAt).toLocaleString()}</p>
              {canRestore ? (
                <ShadButton
                  variant="outline"
                  size="sm"
                  className="mt-1 w-fit rounded-lg hover:border-[#fde047] hover:bg-[#fef08a]/30 hover:text-[#713f12] dark:hover:bg-[#713f12]/30 dark:hover:text-[#fef08a]"
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

export function AiChatPane({
  onGenerate,
  currentElements,
}: {
  onGenerate: (elements: DiagramElementRecord[]) => void;
  currentElements: DiagramElementRecord[];
}) {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState<string>("Flowchart");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/ai/generate-diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, category, currentElements }),
      });
      
      const data = await response.json();
      if (data.elements) {
        onGenerate(data.elements);
        setPrompt("");
      } else {
        console.error("No elements returned:", data.error);
        setErrorMsg(data.error || "Failed to generate diagram");
      }
    } catch (error) {
      console.error("AI Generation failed", error);
      setErrorMsg("Failed to communicate with AI service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      {errorMsg && (
        <div className="flex items-start gap-2 rounded-[8px] bg-coral-emphasis/10 p-3 text-[12px] text-coral-emphasis">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}
      <PanelSection title="Category">
        <div className="flex flex-wrap gap-2">
          {(["Flowchart", "UML", "Network Model", "General"]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-[8px] px-3 py-1 text-[12px] font-medium transition-all ${
                category === cat 
                  ? 'bg-[#fef08a]/90 text-[#713f12] shadow-sm ring-1 ring-[#fde047] dark:bg-[#713f12]/70 dark:text-[#fef08a] dark:ring-[#a16207]' 
                  : 'bg-ash-canvas text-slate hover:bg-[#fef08a]/30 hover:text-[#713f12] dark:bg-muted dark:text-muted-foreground dark:hover:bg-[#713f12]/30 dark:hover:text-[#fef08a]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </PanelSection>
      <PanelSection title="Prompt">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe a diagram..."
            className="flex-1 rounded-[8px] border border-warm-stone bg-paper-white px-3 py-2 text-[14px] text-inkwell-navy shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] placeholder:text-slate focus-visible:border-[#fde047] focus-visible:ring-1 focus-visible:ring-[#fde047] focus-visible:outline-none dark:border-border dark:bg-card dark:text-foreground dark:focus-visible:border-[#a16207]"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={!prompt.trim() || loading} 
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-inkwell-navy text-paper-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] transition hover:bg-[#713f12] hover:text-[#fef08a] dark:hover:bg-[#fef08a] dark:hover:text-[#713f12] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </PanelSection>
    </div>
  );
}

const SHAPE_CATEGORIES = [
  {
    name: "1. Basic Shapes",
    shapes: ["Rectangle", "Rounded Rectangle", "Square", "Circle", "Diamond", "Cloud", "Hexagon", "Triangle", "Trapezoid", "Cylinder", "Isometric Cube"],
  },
  {
    name: "2. Flowchart Shapes",
    shapes: ["Process", "Step", "Document", "Internal Storage", "Card", "Note", "Or", "And"],
  },
  {
    name: "3. Text & Annotation",
    shapes: ["Text", "Note", "Callout", "Curved Text", "Timestamp", "Actor"],
  },
  {
    name: "4. Containers & Grouping",
    shapes: ["Container", "Vertical Container", "Horizontal Container"],
  },
  {
    name: "5. Lines, Arrows & Connectors",
    shapes: ["Line", "Dashed Line", "Dotted Line", "Curve", "Arrow", "Bidirectional Arrow", "Directional Connector", "Bidirectional Connector", "Link", "Connector with Label", "Connector with Labels", "Connector with Symbol", "Manual Line", "Filled Edge", "Horizontal Elbow", "Vertical Elbow", "Arc", "Zigzag", "Waypoint"],
  },
  {
    name: "6. Brackets & Dividers",
    shapes: ["Isometric Edge 2", "Left Curly Bracket", "Right Curly Bracket", "Horizontal Crossbar", "Vertical Crossbar"],
  },
  {
    name: "7. Lists",
    shapes: ["Unordered List", "Ordered List", "Vertical List", "List Item"],
  },
  {
    name: "8. Tables",
    shapes: ["Table 1", "Table 2", "Table", "Table with Title 1", "Table with Title 2", "HTML Table 4", "Cross-Functional Flowchart"],
  },
  {
    name: "9. UML - Structural Diagrams",
    shapes: ["Class", "Class 2", "Interface", "Interface 2", "Provided/Required Interface", "Required Interface", "Object", "Object:Type", "Entity", "Component", "Component with Attributes", "Module", "Package"],
  },
  {
    name: "10. UML - Use Case Diagrams",
    shapes: ["Actor", "Use Case"],
  },
  {
    name: "11. UML - Sequence Diagrams",
    shapes: ["Object", "Lifeline", "Activation Bar", "Found Message", "Found Message 1", "Synchronous Invocation", "Self Call", "Callback", "Return", "Destruction"],
  },
  {
    name: "12. UML - State / Activity Diagrams",
    shapes: ["Start", "End", "Activity", "Composite State", "Condition", "Fork/Join"],
  },
  {
    name: "13. UML - Relationships (Connectors)",
    shapes: ["Association 1", "Relation 1", "Relation 2", "Aggregation 1", "Composition 1", "Dependency", "Generalization", "Implementation"],
  },
];

export function ShapesPane({
  onSelectShape,
}: {
  onSelectShape: (shape: string) => void;
}) {
  return (
    <div className="grid gap-6">
      {SHAPE_CATEGORIES.map((category) => (
        <PanelSection key={category.name} title={category.name}>
          <div className="grid grid-cols-3 gap-2">
            {category.shapes.map((shape) => {
              const def = getShapeDefinition(shape);
              return (
                <button
                  key={shape}
                  onClick={() => onSelectShape(shape)}
                  title={shape}
                  className="group flex flex-col items-center justify-center gap-1 rounded-md border border-warm-stone/50 bg-ash-canvas/30 p-2 text-[9px] font-medium text-slate transition-all hover:bg-[#fef08a]/40 hover:text-[#713f12] hover:border-[#fde047]/60 dark:border-border dark:bg-card dark:hover:bg-[#713f12]/40 dark:hover:text-[#fef08a] dark:hover:border-[#a16207]/60"
                >
                  <svg 
                    viewBox="0 0 100 100" 
                    className="h-8 w-8 text-current"
                    dangerouslySetInnerHTML={{ __html: def.svgMarkup || "" }}
                  />
                  <span className="truncate w-full block text-center leading-tight">{shape}</span>
                </button>
              );
            })}
          </div>
        </PanelSection>
      ))}
    </div>
  );
}
