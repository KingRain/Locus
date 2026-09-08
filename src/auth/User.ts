import { getDb, now } from "../persistence/db";
import { Invitation } from "../sharing/Invitation";
import type { UserRecord } from "../lib/types";

const CLERK_PASSWORD = "@clerk";

export class User {
  constructor(public readonly record: UserRecord) {}

  static findById(id: string): User | null {
    const row = getDb()
      .prepare("SELECT id, email, name, created_at FROM users WHERE id = ?")
      .get(id) as
      | { id: string; email: string; name: string; created_at: number }
      | undefined;
    if (!row) return null;
    return new User({
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
    });
  }

  static findByEmail(email: string): User | null {
    const row = getDb()
      .prepare("SELECT id, email, name, created_at FROM users WHERE email = ?")
      .get(email.toLowerCase()) as
      | { id: string; email: string; name: string; created_at: number }
      | undefined;
    if (!row) return null;
    return new User({
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
    });
  }

  static syncFromClerk(input: { id: string; email: string; name: string }): User {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim() || email.split("@")[0] || "User";
    if (!email) {
      throw new Error("A verified email is required to use Locus.");
    }

    const byClerkId = User.findById(input.id);
    if (byClerkId) {
      getDb()
        .prepare("UPDATE users SET email = ?, name = ? WHERE id = ?")
        .run(email, name, input.id);
      return new User({ ...byClerkId.record, email, name });
    }

    const byEmail = User.findByEmail(email);
    if (byEmail) {
      if (byEmail.record.id !== input.id) {
        User.linkClerkId(byEmail.record, input.id, email, name);
      }
      return User.findById(input.id)!;
    }

    const createdAt = now();
    getDb()
      .prepare(
        "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(input.id, email, name, CLERK_PASSWORD, createdAt);
    Invitation.acceptPendingForUser(input.id, email);
    return new User({ id: input.id, email, name, createdAt });
  }

  /** Re-key a pre-Clerk local account to the Clerk user id while keeping boards and memberships. */
  private static linkClerkId(
    oldUser: UserRecord,
    clerkId: string,
    email: string,
    name: string,
  ): void {
    const db = getDb();
    const oldId = oldUser.id;
    db.exec("PRAGMA foreign_keys = OFF;");
    try {
      db.exec("BEGIN;");
      db.prepare("UPDATE board_members SET user_id = ? WHERE user_id = ?").run(clerkId, oldId);
      db.prepare("UPDATE boards SET owner_id = ? WHERE owner_id = ?").run(clerkId, oldId);
      db.prepare("UPDATE comments SET user_id = ? WHERE user_id = ?").run(clerkId, oldId);
      db.prepare("UPDATE versions SET created_by = ? WHERE created_by = ?").run(clerkId, oldId);
      db.prepare("UPDATE access_requests SET user_id = ? WHERE user_id = ?").run(clerkId, oldId);
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(oldId);
      db.prepare("DELETE FROM recovery_tokens WHERE user_id = ?").run(oldId);
      db.prepare("DELETE FROM users WHERE id = ?").run(oldId);
      db.prepare(
        "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      ).run(clerkId, email, name, CLERK_PASSWORD, oldUser.createdAt);
      db.exec("COMMIT;");
      Invitation.acceptPendingForUser(clerkId, email);
    } catch (error) {
      db.exec("ROLLBACK;");
      throw error;
    } finally {
      db.exec("PRAGMA foreign_keys = ON;");
    }
  }
}
