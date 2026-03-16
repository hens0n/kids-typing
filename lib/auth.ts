import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { db } from "@/lib/db";

const SESSION_COOKIE_NAME = "kids_typing_session";
const SESSION_DURATION_DAYS = 30;

type UserRow = {
  id: number;
  username: string;
  display_name: string;
  password_hash: string;
};

export type AuthUser = {
  id: number;
  username: string;
  displayName: string;
};

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, 64);
  const expectedKey = Buffer.from(hash, "hex");

  if (derivedKey.length !== expectedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedKey);
}

function toAuthUser(row: Pick<UserRow, "id" | "username" | "display_name">): AuthUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
  };
}

export function validateRegistration(input: {
  username: string;
  displayName: string;
  password: string;
}) {
  const username = normalizeUsername(input.username);
  const displayName = input.displayName.trim();
  const password = input.password.trim();

  if (!/^[a-z0-9_-]{3,20}$/.test(username)) {
    return {
      ok: false as const,
      error: "Username must be 3-20 characters using letters, numbers, _ or -.",
    };
  }

  if (displayName.length < 2 || displayName.length > 24) {
    return {
      ok: false as const,
      error: "Display name must be between 2 and 24 characters.",
    };
  }

  if (password.length < 6) {
    return {
      ok: false as const,
      error: "Password must be at least 6 characters.",
    };
  }

  return {
    ok: true as const,
    values: {
      username,
      displayName,
      password,
    },
  };
}

export function createUser(input: {
  username: string;
  displayName: string;
  password: string;
}) {
  const createdAt = nowIso();
  const result = db
    .prepare(
      `
        INSERT INTO users (username, display_name, password_hash, created_at)
        VALUES (?, ?, ?, ?)
      `,
    )
    .run(input.username, input.displayName, hashPassword(input.password), createdAt);

  return {
    id: Number(result.lastInsertRowid),
    username: input.username,
    displayName: input.displayName,
  };
}

export function authenticateUser(username: string, password: string) {
  const normalizedUsername = normalizeUsername(username);
  const row = db
    .prepare(
      `
        SELECT id, username, display_name, password_hash
        FROM users
        WHERE username = ?
      `,
    )
    .get(normalizedUsername) as UserRow | undefined;

  if (!row || !verifyPassword(password, row.password_hash)) {
    return null;
  }

  return toAuthUser(row);
}

async function setSessionCookie(token: string, expiresAt: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    path: "/",
  });
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const createdAt = new Date();
  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  db.prepare(
    `
      INSERT INTO sessions (token, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `,
  ).run(token, userId, expiresAt.toISOString(), createdAt.toISOString());

  await setSessionCookie(token, expiresAt.toISOString());
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const row = db
    .prepare(
      `
        SELECT users.id, users.username, users.display_name, sessions.expires_at
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.token = ?
      `,
    )
    .get(token) as
    | {
        id: number;
        username: string;
        display_name: string;
        expires_at: string;
      }
    | undefined;

  if (!row) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  if (row.expires_at <= nowIso()) {
    db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
  };
}
