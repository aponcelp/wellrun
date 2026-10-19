"use client";
import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/rank";

/** Copies a company's shareable Well Run link. */
export default function CopyLink({ slug, name }: { slug: string; name: string }) {
  const [done, setDone] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (t.current) clearTimeout(t.current);
  }, []);
  const copy = async () => {
    const url = (typeof window !== "undefined" ? window.location.origin : SITE) + "/" + slug;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link", url);
      return;
    }
    setDone(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setDone(false), 1800);
  };
  return (
    <button type="button" className="copylink" onClick={copy} aria-label={`Copy link to ${name}'s Well Run page`}>
      {done ? "Copied ✓" : "Copy link"}
      <span className="sr-only" aria-live="polite">{done ? "Link copied" : ""}</span>
    </button>
  );
}
