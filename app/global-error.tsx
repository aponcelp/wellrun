"use client";
import { useEffect } from "react";
import { reportError } from "@/lib/monitoring";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => reportError(error, { digest: error.digest, global: true }), [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <h1>False start</h1>
        {/* A full reload is the point here, so a plain link. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <p>Well Run hit an error. <a href="/">Back to the board</a></p>
      </body>
    </html>
  );
}
