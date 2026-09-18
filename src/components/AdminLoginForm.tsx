"use client";

import { useState, type FormEvent } from "react";

export function AdminLoginForm() {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Unauthorized");
        setPending(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Unable to sign in. Please try again.");
      setPending(false);
    }
  }

  return (
    <form className="renacon-admin-login" onSubmit={onSubmit}>
      <label htmlFor="admin-secret">Admin secret</label>
      <input
        id="admin-secret"
        type="password"
        name="secret"
        autoComplete="current-password"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        required
      />
      <button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {error ? <p className="renacon-admin-hint" role="alert">{error}</p> : null}
    </form>
  );
}
