"use client";
import { useState } from "react";
import { PanelToggle } from "./Intro";

const STEPS: { verb: string; tool: string }[] = [
  { verb: "Researched by", tool: "Hark" },
  { verb: "stored in", tool: "Supabase" },
  { verb: "built with", tool: "Next.js" },
  { verb: "shipped on", tool: "Vercel" },
  { verb: "logged by", tool: "GitHub Actions" },
  { verb: "watched by", tool: "PostHog + Sentry" },
];

const LOG_URL = "https://github.com/aponcelp/wellrun/actions/workflows/board-update.yml";

/** "How it's built": the whole pipeline in one line, with a plain-English explainer behind a toggle. */
export default function Built() {
  const [open, setOpen] = useState(false);
  return (
    <section className="built" aria-labelledby="built-h">
      <div className="built__top">
        <h2 className="built__h" id="built-h">How it&apos;s built</h2>
        <PanelToggle open={open} onClick={() => setOpen((o) => !o)} label="How it works" controls="built-body" />
      </div>
      <ol className="built__chain">
        {STEPS.map((s, i) => (
          <li key={s.tool}>
            {i > 0 && <span className="built__arr" aria-hidden="true">→</span>}
            <span className="built__verb">{s.verb}</span> <b>{s.tool}</b>
          </li>
        ))}
      </ol>
      <dl className="built__body" id="built-body" hidden={!open}>
        <div><dt>Hark</dt><dd>An AI agent researches each company from public signals (funding, hiring, news, reviews), scores its Pace and Distance, and re-checks the whole board every Sunday. Ops roles come from public Ashby, Greenhouse and Lever job boards.</dd></div>
        <div><dt>Supabase</dt><dd>Where the company data lives.</dd></div>
        <div><dt>Next.js + Vercel</dt><dd>The site is built with Next.js and served from Vercel, with a shareable page for every company.</dd></div>
        <div><dt>GitHub Actions</dt><dd>Publishes a public log of every board update. <a href={LOG_URL} target="_blank" rel="noopener">See the log ↗</a></dd></div>
        <div><dt>PostHog + Sentry</dt><dd>PostHog for privacy-friendly analytics; Sentry for error monitoring.</dd></div>
      </dl>
    </section>
  );
}
