"use client";
import { useEffect } from "react";
import { reportError } from "@/lib/monitoring";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => reportError(error, { digest: error.digest }), [error]);
  return (
    <div className="page page--co">
      <h1 className="co__name" style={{ paddingTop: 24 }}>False start</h1>
      <p className="co__what">Something tripped on this page.</p>
      <p className="back back--end">
        <button type="button" className="chip" onClick={reset}>Try again</button>
      </p>
    </div>
  );
}
