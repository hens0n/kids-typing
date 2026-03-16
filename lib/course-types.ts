export type TypingLevel = {
  id: string;
  order: number;
  name: string;
  description: string;
  focusKeys: string[];
  passWpm: number;
  passAccuracy: number;
  words: string[];
};

export type CourseLevelState = {
  level: TypingLevel;
  unlocked: boolean;
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
  completedRuns: number;
  lastPlayedAt: string | null;
  unlockedAt: string | null;
  completedAt: string | null;
};

export type AttemptResult = {
  progress: CourseLevelState[];
  passed: boolean;
  unlockedLevelId: string | null;
};
