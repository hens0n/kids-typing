"use client";

export default function LearnError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="app-page" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <p className="eyebrow">Typing dojo</p>
        <h1 style={{ fontSize: "2rem", marginBottom: "16px" }}>Could not load your lessons</h1>
        <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
          {error.message || "Something went wrong loading your progress."}
        </p>
        <button type="button" className="primary-button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
