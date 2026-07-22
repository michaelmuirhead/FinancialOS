import { FormEvent, ReactNode, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isDemoMode } from "@/services/firebase";
import {
  clearHouseholdCache,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  subscribeToAuth,
} from "@/services/authService";

/**
 * In demo mode the app is open. With Firebase configured, everything is
 * household-scoped behind Firestore security rules, so a session is
 * required before any data can load.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(isDemoMode);

  useEffect(() => {
    if (isDemoMode) return;
    return subscribeToAuth((nextUser) => {
      if (!nextUser) clearHouseholdCache();
      setUser(nextUser);
      setReady(true);
    });
  }, []);

  if (isDemoMode) return <>{children}</>;
  if (!ready) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading…</p>
      </div>
    );
  }
  if (!user) return <SignInScreen />;
  return <>{children}</>;
}

function SignInScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (authError) {
      setError(
        authError instanceof Error ? authError.message : "Sign-in failed",
      );
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void run(() =>
      mode === "signin"
        ? signInWithEmail(email, password)
        : signUpWithEmail(email, password),
    );
  }

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        padding: "1rem",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 380 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <span
            className="top-header__brand-icon"
            style={{ background: "var(--blue-600)", color: "#fff" }}
          >
            <ShieldCheck size={18} />
          </span>
          <div>
            <div style={{ fontWeight: 700 }}>HomeVault</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Sign in to your household
            </div>
          </div>
        </div>
        {error && (
          <div className="demo-banner" role="alert">
            {error}
          </div>
        )}
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field__label">
            Email
            <input
              className="form-field__input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="form-field__label">
            Password
            <input
              className="form-field__input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
            />
          </label>
          <Button type="submit" disabled={busy}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void run(signInWithGoogle)}
          >
            Continue with Google
          </Button>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--blue-600)",
              fontSize: "0.82rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {mode === "signin"
              ? "New household? Create an account"
              : "Already set up? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
