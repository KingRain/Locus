"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Archive, ChevronRight, FolderOpen, Plus, Search, Share2, Clock, Pencil, Trash2, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { Banner, Logo } from "@/components/brand";
import { AuthControls } from "@/components/auth-controls";
import { TEMPLATE_ICONS } from "@/components/icons";
import { Button } from "@/components/locus-ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { FadeIn, StaggerGrid, StaggerItem } from "@/components/motion/fade-in";
import { TemplateTag } from "@/components/tag-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { readRecentBoards, type RecentBoard } from "@/lib/recent-boards";
import type { BoardRecord, TemplateKind, TemplateRecord } from "@/lib/types";

const KINDS: Record<TemplateKind, string> = {
  uml: "UML",
  flowchart: "Flow",
  er: "ER",
  architecture: "Arch",
};

export function DashboardView() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [query, setQuery] = useState("");
  const [archived, setArchived] = useState(false);
  const [boardTab, setBoardTab] = useState<"mine" | "shared" | "recent">("mine");
  const [boards, setBoards] = useState<BoardRecord[]>([]);
  const [sharedBoards, setSharedBoards] = useState<BoardRecord[]>([]);
  const [recentBoards, setRecentBoards] = useState<RecentBoard[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    async function boot() {
      const [boardData, sharedData, templateData] = await Promise.all([
        api<{ boards: BoardRecord[] }>("/api/boards?status=active&scope=mine"),
        api<{ boards: BoardRecord[] }>("/api/boards?status=active&scope=shared"),
        api<{ templates: TemplateRecord[] }>("/api/templates"),
      ]);
      setBoards(boardData.boards);
      setSharedBoards(sharedData.boards);
      setRecentBoards(readRecentBoards());
      setTemplates(templateData.templates);
    }
    void boot();
  }, [isLoaded, user, router]);

  async function load(status: "active" | "archived", q = query) {
    const data = await api<{ boards: BoardRecord[] }>(
      `/api/boards?status=${status}&scope=mine&q=${encodeURIComponent(q)}`,
    );
    setBoards(data.boards);
  }

  async function loadShared(q = query) {
    const data = await api<{ boards: BoardRecord[] }>(
      `/api/boards?status=active&scope=shared&q=${encodeURIComponent(q)}`,
    );
    setSharedBoards(data.boards);
  }

  async function createBoard(templateKind?: TemplateKind) {
    setBusy(true);
    try {
      const title = templateKind ? `${KINDS[templateKind]} board` : "Untitled board";
      const data = await api<{ board: BoardRecord }>("/api/boards", {
        method: "POST",
        body: JSON.stringify({ title, templateKind }),
      });
      router.push(`/board/${data.board.id}`);
    } finally {
      setBusy(false);
    }
  }

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  async function archive(id: string) {
    await api(`/api/boards/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: archived ? "active" : "archived" }),
    });
    await load(archived ? "archived" : "active");
  }

  async function renameBoard(id: string, newTitle: string) {
    await api(`/api/boards/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title: newTitle }),
    });
    await load(archived ? "archived" : "active");
  }

  async function confirmDeleteBoard() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    await api(`/api/boards/${id}`, {
      method: "DELETE",
    });
    await load(archived ? "archived" : "active");
  }

  const filtered = useMemo(() => boards, [boards]);

  if (!isLoaded || !user) {
    return <div className="grid min-h-screen place-items-center text-slate">Opening your sketchbook…</div>;
  }

  const displayName = user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "You";

  return (
    <div className="min-h-screen">
      <Banner />
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-[14px] text-slate">{displayName}</span>
          <AuthControls compact />
        </div>
      </header>
      <main className="mx-auto grid max-w-[1200px] gap-6 px-6 pb-16 lg:grid-cols-[300px_1fr]">
        <FadeIn delay={0.05}>
          <Card className="h-fit ring-1 ring-foreground/8 shadow-[var(--shadow-stone)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[18px] font-semibold">Boards</CardTitle>
              <CardDescription>Search and open your workspaces</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Tabs
                value={boardTab}
                onValueChange={(value) => {
                  const next = value as typeof boardTab;
                  setBoardTab(next);
                  if (next === "shared") void loadShared();
                  if (next === "recent") setRecentBoards(readRecentBoards());
                }}
              >
                <TabsList className="grid w-full grid-cols-3 bg-ash-canvas">
                  <TabsTrigger value="mine" className="gap-1 text-[11px] data-active:bg-mint-pulse/30">
                    <FolderOpen className="h-3 w-3" />
                    Mine
                  </TabsTrigger>
                  <TabsTrigger value="shared" className="gap-1 text-[11px] data-active:bg-butter-yellow/40">
                    <Share2 className="h-3 w-3" />
                    Shared
                  </TabsTrigger>
                  <TabsTrigger value="recent" className="gap-1 text-[11px] data-active:bg-coral-emphasis/15">
                    <Clock className="h-3 w-3" />
                    Recent
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {boardTab === "mine" ? (
                <>
              <form
                className="relative"
                onSubmit={(event) => {
                  event.preventDefault();
                  void load(archived ? "archived" : "active");
                }}
              >
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search boards"
                  aria-label="Search boards"
                  enterKeyHint="search"
                  className="h-10 rounded-lg pl-9"
                />
              </form>
              <Tabs
                value={archived ? "archived" : "open"}
                onValueChange={(value) => {
                  const next = value === "archived";
                  setArchived(next);
                  void load(next ? "archived" : "active");
                }}
              >
                <TabsList className="grid w-full grid-cols-2 bg-ash-canvas">
                  <TabsTrigger value="open" className="gap-1.5 data-active:bg-mint-pulse/30">
                    <FolderOpen className="h-3.5 w-3.5" />
                    Open
                  </TabsTrigger>
                  <TabsTrigger value="archived" className="gap-1.5 data-active:bg-butter-yellow/40">
                    <Archive className="h-3.5 w-3.5" />
                    Archived
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <ul className="grid gap-2">
                {filtered.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-warm-stone px-3 py-5 text-center text-[13px] text-slate">
                    No boards here yet.
                  </li>
                ) : (
                  filtered.map((board) => (
                    <BoardCardItem
                      key={board.id}
                      board={board}
                      archived={archived}
                      onOpen={() => router.push(`/board/${board.id}`)}
                      onArchive={() => void archive(board.id)}
                      onRename={(newTitle) => void renameBoard(board.id, newTitle)}
                      onDelete={() => setDeleteTargetId(board.id)}
                    />
                  ))
                )}
              </ul>
                </>
              ) : boardTab === "shared" ? (
                <>
                  <form
                    className="relative"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void loadShared();
                    }}
                  >
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search shared boards"
                      aria-label="Search shared boards"
                      enterKeyHint="search"
                      className="h-10 rounded-lg pl-9"
                    />
                  </form>
                  <ul className="grid gap-2">
                    {sharedBoards.length === 0 ? (
                      <li className="rounded-xl border border-dashed border-warm-stone px-3 py-5 text-center text-[13px] text-slate">
                        No shared boards yet. Accept an invite or ask a teammate to share one with you.
                      </li>
                    ) : (
                      sharedBoards.map((board) => (
                        <li key={board.id}>
                          <Card className="group ring-1 ring-foreground/6 transition hover:-translate-y-0.5 hover:ring-foreground/12 hover:shadow-md">
                            <CardContent className="flex items-center justify-between gap-2 py-3">
                              <button
                                className="min-w-0 flex-1 text-left"
                                onClick={() => router.push(`/board/${board.id}`)}
                              >
                                <p className="truncate text-[15px] font-medium">{board.title}</p>
                                <p className="text-[11px] text-slate">Shared with you</p>
                              </button>
                            </CardContent>
                          </Card>
                        </li>
                      ))
                    )}
                  </ul>
                </>
              ) : (
                <ul className="grid gap-2">
                  {recentBoards.length === 0 ? (
                    <li className="rounded-xl border border-dashed border-warm-stone px-3 py-5 text-center text-[13px] text-slate">
                      Open a board and it will show up here.
                    </li>
                  ) : (
                    recentBoards.map((board) => (
                      <li key={board.id}>
                        <Card className="group ring-1 ring-foreground/6 transition hover:-translate-y-0.5 hover:ring-foreground/12 hover:shadow-md">
                          <CardContent className="flex items-center justify-between gap-2 py-3">
                            <button
                              className="min-w-0 flex-1 text-left"
                              onClick={() => router.push(`/board/${board.id}`)}
                            >
                              <p className="truncate text-[15px] font-medium">{board.title}</p>
                              <p className="text-[11px] text-slate">
                                Opened {new Date(board.openedAt).toLocaleString()}
                              </p>
                            </button>
                          </CardContent>
                        </Card>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <section>
          <FadeIn delay={0.1}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[14px] font-medium text-slate">Templates</p>
                <h1 className="font-display text-[32px] leading-[1.2] tracking-tight sm:text-[40px]">
                  Start from a <span className="text-coral-emphasis">shape language</span>
                </h1>
              </div>
              <Button disabled={busy} className="gap-2" onClick={() => void createBoard()}>
                <Plus className="h-4 w-4" />
                Blank board
              </Button>
            </div>
          </FadeIn>

          <StaggerGrid className="mt-8 grid gap-4 sm:grid-cols-2">
            {templates.map((template) => {
              const Icon = TEMPLATE_ICONS[template.kind];
              return (
                <StaggerItem key={template.id}>
                  <Card
                    className={`group h-full ring-1 ring-foreground/8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(21,27,49,0.1)] hover:ring-mint-pulse/40 ${busy ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
                    onClick={() => void createBoard(template.kind)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint-pulse/25 text-inkwell-navy ring-1 ring-mint-pulse/40">
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <TemplateTag kind={template.kind} label={KINDS[template.kind]} />
                      </div>
                      <CardTitle className="text-[22px] font-semibold leading-tight">{template.name}</CardTitle>
                      <CardDescription className="text-[15px] leading-relaxed">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <span className="inline-flex items-center gap-1 text-[13px] font-medium text-slate transition group-hover:gap-2 group-hover:text-inkwell-navy">
                        Use template
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </CardContent>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerGrid>
        </section>
      </main>

      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Permanently Delete Board?"
        description="This action cannot be undone. All shapes, drawings, and notes inside this board will be erased forever."
        confirmLabel="Delete Board"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => void confirmDeleteBoard()}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}

function BoardCardItem({
  board,
  archived,
  onOpen,
  onArchive,
  onRename,
  onDelete,
}: {
  board: BoardRecord;
  archived: boolean;
  onOpen: () => void;
  onArchive: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(board.title);

  function handleSave() {
    const next = title.trim();
    if (next && next !== board.title) {
      onRename(next);
    }
    setEditing(false);
  }

  return (
    <li>
      <Card className="group ring-1 ring-foreground/6 transition hover:-translate-y-0.5 hover:ring-foreground/12 hover:shadow-md">
        <CardContent className="flex items-center justify-between gap-2 py-3">
          {editing ? (
            <div className="flex flex-1 items-center gap-1.5">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") {
                    setTitle(board.title);
                    setEditing(false);
                  }
                }}
                className="h-8 text-[14px]"
                autoFocus
              />
              <button
                type="button"
                className="p-1 text-mint-pulse hover:text-inkwell-navy"
                onClick={handleSave}
                title="Save title"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="p-1 text-slate hover:text-inkwell-navy"
                onClick={() => {
                  setTitle(board.title);
                  setEditing(false);
                }}
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button className="min-w-0 flex-1 text-left" onClick={onOpen}>
              <p className="truncate text-[15px] font-medium">{board.title}</p>
              <p className="text-[11px] text-slate">Click to open</p>
            </button>
          )}

          {!editing && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                className="p-1 text-slate hover:text-inkwell-navy transition"
                onClick={() => setEditing(true)}
                title="Rename board"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="px-1.5 py-0.5 text-[11px] font-medium text-slate transition hover:text-coral-emphasis"
                onClick={onArchive}
              >
                {archived ? "Restore" : "Archive"}
              </button>
              <button
                type="button"
                className="p-1 text-slate hover:text-red-500 transition"
                onClick={onDelete}
                title="Permanently delete board"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  );
}

