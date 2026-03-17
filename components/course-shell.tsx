"use client";

import { startTransition, useEffect, useEffectEvent, useRef, useState, useTransition } from "react";

import { AttemptResult, CourseLevelState } from "@/lib/course-types";
import { buildPracticeText } from "@/lib/levels";

type CourseShellProps = {
  initialProgress: CourseLevelState[];
  userName: string;
};

type AttemptMetrics = {
  wpm: number;
  accuracy: number;
  mistakes: number;
  durationSeconds: number;
};

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m", ",", "."],
];

function summarizeAttempt(targetText: string, typedText: string, durationMs: number): AttemptMetrics {
  const typedChars = typedText.length;
  const correctChars = typedText.split("").filter((character, index) => character === targetText[index]).length;
  const mistakes = typedChars - correctChars;
  const accuracy = typedChars === 0 ? 0 : (correctChars / typedChars) * 100;
  const durationSeconds = Math.max(1, Math.round(durationMs / 1000));
  const wpm = durationMs <= 0 ? 0 : correctChars / 5 / (durationMs / 60000);

  return {
    wpm: Number(wpm.toFixed(1)),
    accuracy: Number(accuracy.toFixed(1)),
    mistakes,
    durationSeconds,
  };
}

function formatNumber(value: number) {
  if (value === 0) {
    return "0";
  }

  return Number(value.toFixed(1)).toString();
}

function formatLastPlayed(value: string | null) {
  if (!value) {
    return "New";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function CourseShell({ initialProgress, userName }: CourseShellProps) {
  const [progress, setProgress] = useState(initialProgress);
  const firstPlayableLevel = initialProgress.find((entry) => entry.unlocked && !entry.completed)?.level.id;
  const [selectedLevelId, setSelectedLevelId] = useState(
    firstPlayableLevel ?? initialProgress[0]?.level.id ?? "",
  );
  const [promptVersion, setPromptVersion] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [attemptMessage, setAttemptMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<(AttemptMetrics & { passed: boolean; unlockedLevelId: string | null }) | null>(null);
  const [isSaving, startSaving] = useTransition();
  const textEntryRef = useRef<HTMLTextAreaElement>(null);
  const submittedKeyRef = useRef<string | null>(null);

  const selectedState = progress.find((entry) => entry.level.id === selectedLevelId) ?? progress[0];
  const selectedLevel = selectedState.level;
  const promptKey = `${selectedLevel.id}:${promptVersion}`;
  const targetText = buildPracticeText(selectedLevel, 22, promptKey);
  const liveDurationMs = finishedAt ?? (startedAt ? Date.now() : null);
  const liveMetrics = summarizeAttempt(targetText, typedText, liveDurationMs ? liveDurationMs - startedAt! : 0);

  useEffect(() => {
    setTypedText("");
    setStartedAt(null);
    setFinishedAt(null);
    setElapsedMs(0);
    setAttemptMessage(null);
    setErrorMessage(null);
    setLastAttempt(null);
    submittedKeyRef.current = null;

    window.requestAnimationFrame(() => {
      textEntryRef.current?.focus();
    });
  }, [selectedLevelId, promptVersion]);

  useEffect(() => {
    if (!startedAt || finishedAt) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 100);

    return () => {
      window.clearInterval(timer);
    };
  }, [finishedAt, startedAt]);

  useEffect(() => {
    if (!startedAt) {
      setElapsedMs(0);
      return;
    }

    if (finishedAt) {
      setElapsedMs(finishedAt - startedAt);
    }
  }, [finishedAt, startedAt]);

  useEffect(() => {
    if (!startedAt || finishedAt) {
      return;
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        // Pause by recording current elapsed
        setElapsedMs(Date.now() - startedAt!);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startedAt, finishedAt]);

  const saveAttempt = useEffectEvent(async (metrics: AttemptMetrics) => {
    let response: Response;
    let payload: unknown;

    try {
      response = await fetch("/api/attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          levelId: selectedLevel.id,
          ...metrics,
        }),
      });

      payload = await response.json();
    } catch {
      throw new Error("Attempt could not be saved.");
    }

    if (!response.ok) {
      throw new Error((payload as { error?: string }).error ?? "Attempt could not be saved.");
    }

    const result = payload as AttemptResult;
    setProgress(result.progress);
    setLastAttempt({
      ...metrics,
      passed: result.passed,
      unlockedLevelId: result.unlockedLevelId,
    });

    if (result.passed) {
      setAttemptMessage(
        result.unlockedLevelId
          ? "Level cleared. The next lesson is now unlocked."
          : "Level cleared. You finished the course.",
      );
    } else {
      setAttemptMessage(
        `Keep going. Reach ${selectedLevel.passWpm} WPM and ${selectedLevel.passAccuracy}% accuracy to unlock the next level.`,
      );
    }
  });

  useEffect(() => {
    const isFinished = typedText.length === targetText.length && targetText.length > 0;

    if (!isFinished || !startedAt || !finishedAt || submittedKeyRef.current === promptKey) {
      return;
    }

    submittedKeyRef.current = promptKey;
    const metrics = summarizeAttempt(targetText, typedText, finishedAt - startedAt);

    startSaving(() => {
      void saveAttempt(metrics).catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : "Attempt could not be saved.");
      });
    });
  }, [finishedAt, promptKey, saveAttempt, startedAt, targetText, typedText]);

  function restartLesson() {
    setPromptVersion((value) => value + 1);
  }

  function handleTextChange(nextValue: string) {
    const sanitizedValue = nextValue.replace(/\n/g, "").slice(0, targetText.length);

    if (!startedAt && sanitizedValue.length > 0) {
      setStartedAt(Date.now());
    }

    if (finishedAt) {
      return;
    }

    setTypedText(sanitizedValue);
    setErrorMessage(null);

    if (sanitizedValue.length === targetText.length) {
      setFinishedAt(Date.now());
    }
  }

  const currentStats = finishedAt ? lastAttempt ?? liveMetrics : liveMetrics;
  const levelTiles = progress;

  return (
    <div className="course-layout">
      <aside className="level-rail">
        <div className="level-rail-copy">
          <p className="eyebrow">Welcome back</p>
          <h2>{userName}</h2>
          <p>Each level unlocks when speed and accuracy both hit the lesson goal.</p>
        </div>

        <div className="level-list">
          {levelTiles.map((entry) => (
            <button
              key={entry.level.id}
              type="button"
              className={entry.level.id === selectedLevel.id ? "level-tile active" : "level-tile"}
              onClick={() => {
                if (!entry.unlocked) {
                  return;
                }

                setSelectedLevelId(entry.level.id);
              }}
              disabled={!entry.unlocked}
            >
              <div>
                <strong>
                  {entry.level.order}. {entry.level.name}
                </strong>
                <p>{entry.level.description}</p>
              </div>
              <div className="level-meta">
                <span>{entry.unlocked ? (entry.completed ? "Passed" : "Open") : "Locked"}</span>
                <small>{formatLastPlayed(entry.lastPlayedAt)}</small>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="practice-panel">
        <header className="practice-header">
          <div>
            <p className="eyebrow">Level {selectedLevel.order}</p>
            <h1>{selectedLevel.name}</h1>
            <p>{selectedLevel.description}</p>
          </div>
          <div className="goal-card">
            <span>Goal</span>
            <strong>
              {selectedLevel.passWpm} WPM / {selectedLevel.passAccuracy}% accuracy
            </strong>
            <small>Focus keys: {selectedLevel.focusKeys.join(" ")}</small>
          </div>
        </header>

        <section className="stats-row" aria-live="polite">
          <article>
            <span>WPM</span>
            <strong>{formatNumber(currentStats.wpm)}</strong>
          </article>
          <article>
            <span>Accuracy</span>
            <strong>{formatNumber(currentStats.accuracy)}%</strong>
          </article>
          <article>
            <span>Mistakes</span>
            <strong>{currentStats.mistakes}</strong>
          </article>
          <article>
            <span>Time</span>
            <strong>{formatNumber(elapsedMs / 1000)}s</strong>
          </article>
          <article>
            <span>Best</span>
            <strong>{formatNumber(selectedState.bestWpm)} WPM</strong>
          </article>
        </section>

        <section
          className="typing-stage"
          onClick={() => {
            textEntryRef.current?.focus();
          }}
        >
          <textarea
            ref={textEntryRef}
            className="typing-input"
            value={typedText}
            onChange={(event) => handleTextChange(event.target.value)}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Typing practice input"
          />

          <div className="prompt-text" aria-hidden="true">
            {targetText.split("").map((character, index) => {
              let className = "pending";

              if (index < typedText.length) {
                className = typedText[index] === character ? "correct" : "incorrect";
              } else if (index === typedText.length) {
                className = "current";
              }

              return (
                <span key={`${promptKey}-${index}`} className={className}>
                  {character === " " ? "\u00A0" : character}
                </span>
              );
            })}
          </div>

          <div className="stage-actions">
            <button type="button" className="ghost-button" onClick={restartLesson}>
              Restart lesson
            </button>
            <p>Click here and start typing. Eyes on the text, not the keyboard.</p>
          </div>
        </section>

        <section className="keyboard-card">
          <div className="keyboard-copy">
            <span>Keyboard focus</span>
            <strong>{selectedLevel.focusKeys.join(" ")}</strong>
          </div>
          <div className="keyboard-grid">
            {KEYBOARD_ROWS.map((row) => (
              <div key={row.join("")} className="keyboard-row">
                {row.map((key) => {
                  const isActive = selectedLevel.focusKeys.includes(key) || selectedLevel.focusKeys[0] === "all keys";

                  return (
                    <span key={key} className={isActive ? "keyboard-key active" : "keyboard-key"}>
                      {key}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <section className="results-row">
          <article className="result-card">
            <span>Lesson status</span>
            <strong>{selectedState.completed ? "Passed" : "In progress"}</strong>
            <p>{attemptMessage ?? "Finish a run to save progress."}</p>
          </article>
          <article className="result-card">
            <span>Total runs</span>
            <strong>{selectedState.completedRuns}</strong>
            <p>Best accuracy: {formatNumber(selectedState.bestAccuracy)}%</p>
          </article>
          <article className="result-card">
            <span>Next step</span>
            <strong>
              {lastAttempt?.unlockedLevelId
                ? progress.find((entry) => entry.level.id === lastAttempt.unlockedLevelId)?.level.name
                : "Keep practicing"}
            </strong>
            <p>
              {lastAttempt?.unlockedLevelId ? (
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setSelectedLevelId(lastAttempt.unlockedLevelId!);
                    startTransition(() => {
                      setPromptVersion((value) => value + 1);
                    });
                  }}
                >
                  Jump to the next lesson
                </button>
              ) : (
                "Hit the lesson goal to unlock what comes next."
              )}
            </p>
          </article>
        </section>

        {isSaving ? <p className="status-note" role="status">Saving attempt...</p> : null}
        {errorMessage ? <p className="status-note error" role="alert">{errorMessage}</p> : null}
      </section>
    </div>
  );
}
