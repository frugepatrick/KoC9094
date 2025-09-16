// app/signin/page.tsx
'use client';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/";

  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(null);
    const res = await signIn("credentials", {
      memberId,
      password,
      callbackUrl,
      redirect: false, // handle result manually to show errors
    });
    setSubmitting(false);
    if (res?.error) {
      setErr("Invalid member ID or password.");
    } else if (res?.ok) {
      // NextAuth will also auto-redirect when redirect:true
      window.location.assign(callbackUrl);
    }
  }

  return (
    <main className="container d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "70vh" }}>
      <div className="card shadow-sm" style={{ maxWidth: 420, width: "100%" }}>
        <div className="card-body">
          <h1 className="h4 mb-3 text-center">Sign in</h1>

          {err && <div className="alert alert-danger py-2">{err}</div>}

          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">Member ID</label>
              <input
                className="form-control"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button className="btn btn-primary w-100" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
