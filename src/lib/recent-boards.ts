const STORAGE_KEY = "locus_recent_boards";
const MAX = 12;

export type RecentBoard = {
  id: string;
  title: string;
  openedAt: number;
};

export function recordRecentBoard(board: { id: string; title: string }): void {
  if (typeof window === "undefined") return;
  const current = readRecentBoards().filter((item) => item.id !== board.id);
  const next: RecentBoard[] = [
    { id: board.id, title: board.title, openedAt: Date.now() },
    ...current,
  ].slice(0, MAX);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function readRecentBoards(): RecentBoard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentBoard[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
