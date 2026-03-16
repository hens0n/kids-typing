import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const databasePath = join(process.cwd(), "data", "kids-typing.sqlite");

declare global {
  // eslint-disable-next-line no-var
  var __kidsTypingDb: Database.Database | undefined;
}

function createDatabase() {
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress (
      user_id INTEGER NOT NULL,
      level_id TEXT NOT NULL,
      unlocked_at TEXT NOT NULL,
      best_wpm REAL NOT NULL DEFAULT 0,
      best_accuracy REAL NOT NULL DEFAULT 0,
      completed_runs INTEGER NOT NULL DEFAULT 0,
      last_played_at TEXT,
      completed_at TEXT,
      PRIMARY KEY (user_id, level_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      level_id TEXT NOT NULL,
      wpm REAL NOT NULL,
      accuracy REAL NOT NULL,
      mistakes INTEGER NOT NULL,
      duration_seconds INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_attempts_user_created_at ON attempts(user_id, created_at DESC);
  `);

  return database;
}

export const db = global.__kidsTypingDb ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  global.__kidsTypingDb = db;
}
