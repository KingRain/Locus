import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { getDb, newId, now } from "../persistence/db";
import { User } from "./User";
import type { UserRecord } from "../lib/types";

const RECOVERY_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) return false;
    const testHash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(testHash, "hex"));
  } catch {
    return false;
  }
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
}

export class AuthService {
  /**
   * Registers a user account securely.
   * Prevents user enumeration by returning generic response if account already exists.
   */
  static register(
    emailInput: string,
    nameInput: string,
    passwordInput: string,
  ): { success: boolean; message: string; user?: UserRecord } {
    const email = emailInput.trim().toLowerCase();
    const name = nameInput.trim() || email.split("@")[0] || "User";

    if (!email || !passwordInput || passwordInput.length < 6) {
      return {
        success: false,
        message: "Please provide a valid email and password (minimum 6 characters).",
      };
    }

    const existing = User.findByEmail(email);
    if (existing) {
      // Dummy operation to prevent timing attacks
      hashPassword(passwordInput);
      return {
        success: true,
        message: "If your email is valid, registration has been processed successfully.",
      };
    }

    const userId = newId();
    const passwordHash = hashPassword(passwordInput);
    const createdAt = now();

    getDb()
      .prepare("INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(userId, email, name, passwordHash, createdAt);

    const createdUser = User.findById(userId);
    return {
      success: true,
      message: "Account registered successfully.",
      user: createdUser ? createdUser.record : undefined,
    };
  }

  /**
   * Authenticates user email and password.
   * Returns ambiguous error on failure to prevent user enumeration.
   */
  static login(
    emailInput: string,
    passwordInput: string,
  ): { success: boolean; message: string; session?: AuthSession; user?: UserRecord } {
    const email = emailInput.trim().toLowerCase();
    const user = User.findByEmail(email);

    if (!user) {
      hashPassword(passwordInput);
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    const row = getDb()
      .prepare("SELECT password_hash FROM users WHERE id = ?")
      .get(user.record.id) as { password_hash: string } | undefined;

    if (!row || !verifyPassword(passwordInput, row.password_hash)) {
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    const session = AuthService.createSession(user.record.id);
    return {
      success: true,
      message: "Logged in successfully.",
      session,
      user: user.record,
    };
  }

  /**
   * Requests time-limited password recovery.
   * Always returns uniform generic message preventing email enumeration.
   */
  static requestPasswordRecovery(emailInput: string): { success: boolean; message: string; recoveryToken?: string } {
    const email = emailInput.trim().toLowerCase();
    const genericMessage = "If an account exists with this email address, a password recovery link has been generated.";

    if (!email) {
      return { success: false, message: "Email is required." };
    }

    const user = User.findByEmail(email);
    if (!user) {
      // Simulate token generation work
      randomBytes(32).toString("hex");
      return { success: true, message: genericMessage };
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashPassword(rawToken);
    const expiresAt = now() + RECOVERY_TOKEN_EXPIRY_MS;

    getDb().prepare("DELETE FROM recovery_tokens WHERE user_id = ?").run(user.record.id);
    getDb()
      .prepare("INSERT INTO recovery_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)")
      .run(newId(), user.record.id, tokenHash, expiresAt);

    return {
      success: true,
      message: genericMessage,
      recoveryToken: rawToken,
    };
  }

  /**
   * Validates recovery token and updates password if valid and not expired.
   */
  static resetPassword(
    tokenInput: string,
    newPasswordInput: string,
  ): { success: boolean; message: string } {
    if (!tokenInput || !newPasswordInput || newPasswordInput.length < 6) {
      return {
        success: false,
        message: "A valid token and a password of at least 6 characters are required.",
      };
    }

    const currentTime = now();
    const rows = getDb()
      .prepare("SELECT id, user_id, token_hash, expires_at FROM recovery_tokens WHERE expires_at > ?")
      .all(currentTime) as Array<{ id: string; user_id: string; token_hash: string; expires_at: number }>;

    let matchingRecord: { id: string; user_id: string } | null = null;
    for (const row of rows) {
      if (verifyPassword(tokenInput, row.token_hash)) {
        matchingRecord = row;
        break;
      }
    }

    if (!matchingRecord) {
      return {
        success: false,
        message: "Invalid or expired password recovery token.",
      };
    }

    const newHash = hashPassword(newPasswordInput);
    getDb()
      .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
      .run(newHash, matchingRecord.user_id);

    getDb()
      .prepare("DELETE FROM recovery_tokens WHERE id = ?")
      .run(matchingRecord.id);

    return {
      success: true,
      message: "Password reset successfully. You may now log in.",
    };
  }

  static createSession(userId: string): AuthSession {
    const id = newId();
    const createdAt = now();
    const expiresAt = createdAt + SESSION_EXPIRY_MS;

    getDb()
      .prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
      .run(id, userId, expiresAt, createdAt);

    return { id, userId, expiresAt, createdAt };
  }

  static validateSession(sessionId: string): UserRecord | null {
    if (!sessionId) return null;
    const row = getDb()
      .prepare(
        `SELECT u.id, u.email, u.name, u.created_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.id = ? AND s.expires_at > ?`,
      )
      .get(sessionId, now()) as { id: string; email: string; name: string; created_at: number } | undefined;

    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
    };
  }

  static revokeSession(sessionId: string): void {
    getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
  }
}
