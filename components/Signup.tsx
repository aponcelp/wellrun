"use client";
import { useState } from "react";
import { reportError } from "@/lib/monitoring";

// One quiet line: the weekly changes by email (Beehiiv). No popup, no counter.
export default function Signup({ compact = false }: { compact?: boolean }) {
  const id = compact ? "signup-email-hero" : "signup-email";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const r = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) {
        setState("done");
        window.posthog?.capture?.("newsletter_signup", { path: location.pathname, spot: compact ? "hero" : "footer" });
      } else {
        setState("error");
        setMsg(j.error || "Something went wrong. Try again.");
      }
    } catch (err) {
      reportError(err, { where: "signup" });
      setState("error");
      setMsg("Something went wrong. Try again.");
    }
  }
  if (state === "done") return <p className={`signup signup--done${compact ? " signup--sm" : ""}`}>You&apos;re in. The weekly changes land in your inbox every Monday.</p>;
  return (
    <form className={`signup${compact ? " signup--sm" : ""}`} onSubmit={submit}>
      <label htmlFor={id} className="signup__label">Get the weekly changes</label>
      <div className="signup__row">
        <input id={id} type="email" required autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" disabled={state === "sending"}>{state === "sending" ? "…" : "Subscribe"}</button>
      </div>
      {state === "error" && <p className="signup__err">{msg}</p>}
    </form>
  );
}
