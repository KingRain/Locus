import { getDb, newId, now } from "../persistence/db";
import type { UserRecord } from "../lib/types";

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

  static create(input: { email: string; name: string; passwordHash: string }): User {
    const id = newId();
    const createdAt = now();
    getDb()
      .prepare(
        "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(id, input.email.toLowerCase(), input.name.trim(), input.passwordHash, createdAt);
    return new User({
      id,
      email: input.email.toLowerCase(),
      name: input.name.trim(),
      createdAt,
    });
  }

  passwordHash(): string {
    const row = getDb()
      .prepare("SELECT password_hash FROM users WHERE id = ?")
      .get(this.record.id) as { password_hash: string } | undefined;
    if (!row) throw new Error("User not found");
    return row.password_hash;
  }

  updateProfile(name: string): User {
    getDb().prepare("UPDATE users SET name = ? WHERE id = ?").run(name.trim(), this.record.id);
    return new User({ ...this.record, name: name.trim() });
  }

  updatePassword(passwordHash: string): void {
    getDb()
      .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
      .run(passwordHash, this.record.id);
  }
}
