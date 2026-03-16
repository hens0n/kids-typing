import { AttemptResult, CourseLevelState } from "@/lib/course-types";
import { db } from "@/lib/db";
import { LEVELS, getLevelById, getNextLevelId } from "@/lib/levels";

type ProgressRow = {
  level_id: string;
  unlocked_at: string;
  best_wpm: number;
  best_accuracy: number;
  completed_runs: number;
  last_played_at: string | null;
  completed_at: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

export function getCourseProgressForUser(userId: number): CourseLevelState[] {
  const rows = db
    .prepare(
      `
        SELECT
          level_id,
          unlocked_at,
          best_wpm,
          best_accuracy,
          completed_runs,
          last_played_at,
          completed_at
        FROM progress
        WHERE user_id = ?
      `,
    )
    .all(userId) as ProgressRow[];

  const progressById = new Map(rows.map((row) => [row.level_id, row]));
  let previousLevelCompleted = false;

  return LEVELS.map((level, index) => {
    const row = progressById.get(level.id);
    const unlocked = index === 0 || Boolean(row?.unlocked_at) || previousLevelCompleted;
    const completed = Boolean(row?.completed_at);

    previousLevelCompleted = completed;

    return {
      level,
      unlocked,
      completed,
      bestWpm: row?.best_wpm ?? 0,
      bestAccuracy: row?.best_accuracy ?? 0,
      completedRuns: row?.completed_runs ?? 0,
      lastPlayedAt: row?.last_played_at ?? null,
      unlockedAt: row?.unlocked_at ?? (index === 0 ? nowIso() : null),
      completedAt: row?.completed_at ?? null,
    };
  });
}

export function recordAttempt(input: {
  userId: number;
  levelId: string;
  wpm: number;
  accuracy: number;
  mistakes: number;
  durationSeconds: number;
}): AttemptResult {
  const level = getLevelById(input.levelId);

  if (!level) {
    throw new Error("Unknown level.");
  }

  const passed = input.wpm >= level.passWpm && input.accuracy >= level.passAccuracy;
  const timestamp = nowIso();
  const nextLevelId = getNextLevelId(level.id);

  const transaction = db.transaction(() => {
    db.prepare(
      `
        INSERT INTO attempts (
          user_id,
          level_id,
          wpm,
          accuracy,
          mistakes,
          duration_seconds,
          completed,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `,
    ).run(
      input.userId,
      input.levelId,
      input.wpm,
      input.accuracy,
      input.mistakes,
      input.durationSeconds,
      timestamp,
    );

    const existingProgress = db
      .prepare(
        `
          SELECT
            unlocked_at,
            best_wpm,
            best_accuracy,
            completed_runs,
            completed_at
          FROM progress
          WHERE user_id = ? AND level_id = ?
        `,
      )
      .get(input.userId, input.levelId) as
      | {
          unlocked_at: string;
          best_wpm: number;
          best_accuracy: number;
          completed_runs: number;
          completed_at: string | null;
        }
      | undefined;

    if (existingProgress) {
      db.prepare(
        `
          UPDATE progress
          SET
            best_wpm = ?,
            best_accuracy = ?,
            completed_runs = ?,
            last_played_at = ?,
            completed_at = ?
          WHERE user_id = ? AND level_id = ?
        `,
      ).run(
        Math.max(existingProgress.best_wpm, input.wpm),
        Math.max(existingProgress.best_accuracy, input.accuracy),
        existingProgress.completed_runs + 1,
        timestamp,
        existingProgress.completed_at ?? (passed ? timestamp : null),
        input.userId,
        input.levelId,
      );
    } else {
      db.prepare(
        `
          INSERT INTO progress (
            user_id,
            level_id,
            unlocked_at,
            best_wpm,
            best_accuracy,
            completed_runs,
            last_played_at,
            completed_at
          )
          VALUES (?, ?, ?, ?, ?, 1, ?, ?)
        `,
      ).run(
        input.userId,
        input.levelId,
        timestamp,
        input.wpm,
        input.accuracy,
        timestamp,
        passed ? timestamp : null,
      );
    }

    if (passed && nextLevelId) {
      db.prepare(
        `
          INSERT INTO progress (
            user_id,
            level_id,
            unlocked_at,
            best_wpm,
            best_accuracy,
            completed_runs,
            last_played_at,
            completed_at
          )
          VALUES (?, ?, ?, 0, 0, 0, NULL, NULL)
          ON CONFLICT(user_id, level_id) DO NOTHING
        `,
      ).run(input.userId, nextLevelId, timestamp);
    }
  });

  transaction();

  return {
    progress: getCourseProgressForUser(input.userId),
    passed,
    unlockedLevelId: passed ? nextLevelId : null,
  };
}
