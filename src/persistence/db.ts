import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { seedTemplates } from "../board/templates/seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "locus.db");

type GlobalDb = typeof globalThis & { __locusDb?: DatabaseSync };

function createDb(): DatabaseSync {
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_by_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS recovery_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'archived')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_by_expiry ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS boards_by_owner_updated ON boards(owner_id, updated_at DESC);
    CREATE TABLE IF NOT EXISTS board_members (
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'commenter', 'viewer')),
      PRIMARY KEY (board_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS members_by_user ON board_members(user_id);
    CREATE TABLE IF NOT EXISTS diagram_elements (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      rotation REAL NOT NULL DEFAULT 0,
      fill TEXT NOT NULL,
      stroke TEXT NOT NULL,
      text TEXT NOT NULL DEFAULT '',
      text_align TEXT NOT NULL DEFAULT 'left',
      from_id TEXT,
      to_id TEXT,
      z_index INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS elements_by_board ON diagram_elements(board_id);
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      element_id TEXT,
      parent_id TEXT,
      user_id TEXT NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      x REAL,
      y REAL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS comments_by_board ON comments(board_id);
    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      snapshot TEXT NOT NULL,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS versions_by_board ON versions(board_id);
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      description TEXT NOT NULL,
      snapshot TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'revoked')),
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS access_requests (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied')),
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS exports (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      format TEXT NOT NULL,
      file_path TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  try {
    db.exec(`ALTER TABLE diagram_elements ADD COLUMN text_align TEXT NOT NULL DEFAULT 'left'`);
  } catch {
    // column already exists
  }
  seedTemplates(db);
  try { db.exec("ALTER TABLE comments ADD COLUMN x REAL;"); } catch {}
  try { db.exec("ALTER TABLE comments ADD COLUMN y REAL;"); } catch {}
  return db;
}

export function getDb(): DatabaseSync {
  const g = globalThis as GlobalDb;
  if (!g.__locusDb) {
    g.__locusDb = createDb();
  }
  return g.__locusDb;
}

export function now(): number {
  return Date.now();
}

export function newId(): string {
  return crypto.randomUUID();
}
