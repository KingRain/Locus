import type { PresenceUser } from "../lib/types";

const COLORS = ["#ff5858", "#86e0c1", "#fedf89", "#151b31", "#6d6f75"];

type Occupant = {
  userId: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
  socketId: string;
};

export class PresenceManager {
  private rooms = new Map<string, Map<string, Occupant>>();

  join(boardId: string, socketId: string, userId: string, name: string): PresenceUser[] {
    const room = this.rooms.get(boardId) ?? new Map<string, Occupant>();
    const color = COLORS[room.size % COLORS.length] ?? "#ff5858";
    room.set(socketId, { userId, name, color, cursor: null, socketId });
    this.rooms.set(boardId, room);
    return this.list(boardId);
  }

  leave(boardId: string, socketId: string): PresenceUser[] {
    const room = this.rooms.get(boardId);
    room?.delete(socketId);
    if (room && room.size === 0) this.rooms.delete(boardId);
    return this.list(boardId);
  }

  cursor(boardId: string, socketId: string, x: number, y: number): Occupant | null {
    const occupant = this.rooms.get(boardId)?.get(socketId);
    if (!occupant) return null;
    occupant.cursor = { x, y };
    return occupant;
  }

  list(boardId: string): PresenceUser[] {
    const room = this.rooms.get(boardId);
    if (!room) return [];
    const unique = new Map<string, PresenceUser>();
    for (const occupant of room.values()) {
      unique.set(occupant.userId, {
        userId: occupant.userId,
        name: occupant.name,
        color: occupant.color,
        cursor: occupant.cursor,
      });
    }
    return [...unique.values()];
  }

  boardForSocket(socketId: string): string | null {
    for (const [boardId, room] of this.rooms) {
      if (room.has(socketId)) return boardId;
    }
    return null;
  }
}

export const presenceManager = new PresenceManager();
