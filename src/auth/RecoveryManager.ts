import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { getDb, newId, now } from "../persistence/db";
import { User } from "./User";
import { hashPassword, hashToken } from "./passwords";

const GENERIC =
  "If an account exists for that email, we sent recovery instructions.";

export class RecoveryManager {
  request(email: string): { message: string } {
    const user = User.findByEmail(email.trim().toLowerCase());
    if (!user) return { message: GENERIC };

    const token = randomBytes(24).toString("hex");
    const expiresAt = now() + 60 * 60 * 1000;
    getDb()
      .prepare(
        "INSERT INTO recovery_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
      )
      .run(newId(), user.record.id, hashToken(token), expiresAt);

    // BASE: no mailer yet — write the one-time link for local testing.
    const dir = path.join(process.cwd(), "data");
    mkdirSync(dir, { recursive: true });
    appendFileSync(
      path.join(dir, "recovery.log"),
      `${new Date().toISOString()} ${user.record.email} /recover?token=${token}\n`,
    );
    return { message: GENERIC };
  }

  reset(token: string, password: string): { ok: true } {
    if (password.length < 8) {
      throw new Error("Choose a password with at least 8 characters.");
    }
    const row = getDb()
      .prepare(
        "SELECT id, user_id, expires_at FROM recovery_tokens WHERE token_hash = ?",
      )
      .get(hashToken(token)) as
      | { id: string; user_id: string; expires_at: number }
      | undefined;
    if (!row || row.expires_at <= now()) {
      throw new Error("This recovery link is invalid or has expired.");
    }
    const user = User.findById(row.user_id);
    if (!user) throw new Error("This recovery link is invalid or has expired.");
    user.updatePassword(hashPassword(password));
    getDb().prepare("DELETE FROM recovery_tokens WHERE id = ?").run(row.id);
    getDb().prepare("DELETE FROM sessions WHERE user_id = ?").run(user.record.id);
    return { ok: true };
  }
}

export const recoveryManager = new RecoveryManager();
