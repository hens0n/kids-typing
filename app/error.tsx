"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="marketing-page" style={{ display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "16px" }}>Something went wrong</h1>
        <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
          {error.message || "An unexpected error occurred."}
        </p>
        <button type="button" className="primary-button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
