import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const databasePath = join(process.cwd(), "data", "kids-typing.sqlite");

declare global {
  // eslint-disable-next-line no-var
  var __kidsTypingDb: Database.Database | undefined;
}

function createDatabase() {
  try {
    mkdirSync(dirname(databasePath), { recursive: true });

    const database = new Database(databasePath);
    database.pragma("journal_mode = WAL");
    database.pragma("synchronous = NORMAL");
    database.pragma("foreign_keys = ON");
    database.pragma("busy_timeout = 5000");

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
        best_wpm REAL NOT NULL DEFAULT 0 CHECK(best_wpm >= 0),
        best_accuracy REAL NOT NULL DEFAULT 0 CHECK(best_accuracy >= 0 AND best_accuracy <= 100),
        completed_runs INTEGER NOT NULL DEFAULT 0 CHECK(completed_runs >= 0),
        last_played_at TEXT,
        completed_at TEXT,
        PRIMARY KEY (user_id, level_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        level_id TEXT NOT NULL,
        wpm REAL NOT NULL CHECK(wpm >= 0),
        accuracy REAL NOT NULL CHECK(accuracy >= 0 AND accuracy <= 100),
        mistakes INTEGER NOT NULL CHECK(mistakes >= 0),
        duration_seconds INTEGER NOT NULL CHECK(duration_seconds > 0),
        completed INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_attempts_user_created_at ON attempts(user_id, created_at DESC);
    `);

    database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date().toISOString());

    return database;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

export const db = global.__kidsTypingDb ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  global.__kidsTypingDb = db;
}

function closeDatabase() {
  try {
    db.close();
  } catch {
    // Ignore errors during shutdown
  }
}

process.on("exit", closeDatabase);
process.on("SIGINT", () => {
  closeDatabase();
  process.exit(0);
});
process.on("SIGTERM", () => {
  closeDatabase();
  process.exit(0);
});
