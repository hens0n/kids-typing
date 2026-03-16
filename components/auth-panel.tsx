import { loginAction, registerAction } from "@/app/actions/auth";

type AuthPanelProps = {
  activeTab: "login" | "create";
  errorMessage?: string;
};

export function AuthPanel({ activeTab, errorMessage }: AuthPanelProps) {
  return (
    <section className="auth-shell">
      <div className="auth-copy">
        <p className="eyebrow">Kids Typing Course</p>
        <h1>Typing lessons that unlock one row at a time.</h1>
        <p className="auth-lead">
          Home row first, then more keys as your kids get smoother and more accurate. The
          practice screen is designed to feel familiar if you like Monkeytype, but tuned for
          shorter, gentler lessons.
        </p>
        <div className="feature-grid">
          <article>
            <span>01</span>
            <strong>Progressive levels</strong>
            <p>Eight lessons unlock in order, from home row drills to full sentences.</p>
          </article>
          <article>
            <span>02</span>
            <strong>Local accounts</strong>
            <p>Each child gets a local username and password. No third-party auth required.</p>
          </article>
          <article>
            <span>03</span>
            <strong>SQLite storage</strong>
            <p>Attempts, progress, and unlocks live in one local SQLite database file.</p>
          </article>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Authentication">
          <a
            className={activeTab === "login" ? "auth-tab active" : "auth-tab"}
            href="/?tab=login"
          >
            Sign in
          </a>
          <a
            className={activeTab === "create" ? "auth-tab active" : "auth-tab"}
            href="/?tab=create"
          >
            Create account
          </a>
        </div>

        {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

        {activeTab === "login" ? (
          <form action={loginAction} className="auth-form">
            <label>
              Username
              <input name="username" autoComplete="username" placeholder="sam" required />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="secret123"
                required
              />
            </label>
            <button type="submit" className="primary-button">
              Start typing
            </button>
          </form>
        ) : (
          <form action={registerAction} className="auth-form">
            <label>
              Username
              <input name="username" autoComplete="username" placeholder="sam" required />
            </label>
            <label>
              Display name
              <input name="displayName" placeholder="Sam" required />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="secret123"
                required
              />
            </label>
            <button type="submit" className="primary-button">
              Create account
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
