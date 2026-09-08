import { getDb, newId, now } from "../persistence/db";
import type { SessionRecord } from "../lib/types";

const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;

export class Session {
  constructor(public readonly record: SessionRecord) {}

  get isExpired(): boolean {
    return this.record.expiresAt <= now();
  }

  static create(userId: string): Session {
    const record: SessionRecord = {
      id: newId(),
      userId,
      expiresAt: now() + TWO_WEEKS,
      createdAt: now(),
    };
    getDb()
      .prepare(
        "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
      )
      .run(record.id, record.userId, record.expiresAt, record.createdAt);
    return new Session(record);
  }

  static find(id: string): Session | null {
    const row = getDb()
      .prepare("SELECT id, user_id, expires_at, created_at FROM sessions WHERE id = ?")
      .get(id) as
      | { id: string; user_id: string; expires_at: number; created_at: number }
      | undefined;
    if (!row) return null;
    return new Session({
      id: row.id,
      userId: row.user_id,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    });
  }

  revoke(): void {
    getDb().prepare("DELETE FROM sessions WHERE id = ?").run(this.record.id);
  }
}
