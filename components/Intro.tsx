"use client";
import { useState } from "react";
import { DMETA, DISTS, ZONES } from "@/lib/rank";
import { cap } from "@/lib/track";
import { Meter } from "./Marks";

/** "What is Well Run?" (copy kept verbatim from the original site). */
export function Story() {
  return (
    <details
      className="story"
      id="story"
      onClick={(e) => {
        const sum = (e.target as HTMLElement).closest("#story > summary");
        if (sum && !(e.currentTarget as HTMLDetailsElement).open) cap("story_opened");
      }}
    >
      <summary>What is Well Run?</summary>
      <div className="story__body">
        <p className="story__lead">Startups announce big rounds every week. I wanted to know how they&apos;re really doing, so I built a score from public signals and gave it a race theme.</p>
        <div className="story__grid">
          <div className="story__item"><span className="story__k">Pace</span><p>How fast a company is moving right now: hiring, recent funding, real growth, minus red flags like layoffs. Zones run from Sprint to Steady.</p></div>
          <div className="story__item"><span className="story__k">Distance</span><p>Whether the product can last. A Marathon is hard to copy; a 10K could have a rival next year.</p></div>
          <div className="story__item"><span className="story__k">Weekly</span><p>Every Sunday the board is rescored and re-ranked: the top 100 make the Well Run 100, and everyone else is in the Chase Pack. Tap any company to see why, with sources.</p></div>
        </div>
        <p className="story__cta">Know a startup that belongs here? <a href="https://www.linkedin.com/in/alfredoponcedeleon" target="_blank" rel="noopener">Send it my way →</a></p>
      </div>
    </details>
  );
}

/** "How scoring works" toggle and legend. */
export function Scoring() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="ltoggle"
        id="ltoggle"
        aria-expanded={open}
        aria-controls="legendwrap"
        onClick={() => {
          cap("scoring_help_toggled");
          setOpen((o) => !o);
        }}
      >
        How scoring works<i aria-hidden="true">+</i>
      </button>
      <div className={"legend" + (open ? " is-open" : "")} id="legendwrap" aria-label="Pace legend" hidden={!open}>
        <div className="legend__col">
          <p className="legend__rule"><b>Pace = momentum:</b> open roles (all teams), how recent the last round was, traction (ARR, customers, headcount) and red flags. Checked weekly.</p>
          <ul className="legend__zones">
            {ZONES.map((z) => (
              <li key={z.key} className={`z-${z.key}`}>
                <span className="zm"><i className="zm__tok" aria-hidden="true" /><span className="zm__name">{z.name}</span></span>
                <span className="legend__split">{z.split}<small>/km</small></span>
                <Meter on={z.bars} of={5} />
                <span className="legend__n">{z.range}</span>
                {z.desc && <span className="legend__d">{z.desc}</span>}
              </li>
            ))}
          </ul>
          <details className="formula">
            <summary>How the score is calculated</summary>
            <div className="formula__body">
              <p><b>Score = Hiring + Funding + Traction − Red flags</b> (never below 0)</p>
              <dl>
                <dt>Hiring</dt><dd>Open roles, all teams: 30+ = 2 · 10–29 = 1.5 · 3–9 = 1 · 1–2 = 0.5 · none = 0</dd>
                <dt>Funding</dt><dd>Last VC round: within 6 mo = 1.5 · 6–12 mo = 1 · 12–24 mo = 0.5 · older = 0. +0.5 for a $100M+ round in the last 24 mo. Capped at 2. Debt, PE, secondaries and tenders don&apos;t count.</dd>
                <dt>Traction</dt><dd>Strong ARR, customer or headcount growth = 1.5 · some = 0.75 · none = 0</dd>
                <dt>Red flags</dt><dd>−1 each for significant issues in the last 24 mo: layoffs or shrinking headcount (&gt;5% YoY), down rounds, major lawsuits, exec exodus. Every flag links its public sources.</dd>
              </dl>
              <p><b>Zones:</b> 4.75+ Sprint · 4.25–4.74 Race · 3.5–4.24 Tempo · 1.5–3.49 Steady · under 1.5 Warm-up. Early companies (seed, or a Series A of $15M or less) also sit in Warm-up until they show strong traction. Cool-down = under 1.5 <i>and</i> last round over 24 mo old or shrinking.</p>
            </div>
          </details>
        </div>
        <div className="legend__col">
          <p className="legend__rule"><b>Distance = staying power:</b> Pace shows how fast a company is running now. Distance shows whether it can keep going for years. It&apos;s a separate label and doesn&apos;t change the score or the order.</p>
          <ul className="legend__dists">
            {DISTS.map((d) => (
              <li key={d}>
                <span className={"dm__km" + (DMETA[d].km ? "" : " dm--none")}>{DMETA[d].km ? <>{DMETA[d].km}<small>km</small></> : "—"}</span>
                <span className="dm__low"><Meter on={DMETA[d].bars} of={4} /><span className="dm__name">{d}</span></span>
                <span className="legend__d">{DMETA[d].blurb}</span>
              </li>
            ))}
          </ul>
          <details className="formula">
            <summary>How Distance is calculated</summary>
            <div className="formula__body">
              <p><b>1. The edge:</b> what gets stronger with every customer? Each company gets one or two:</p>
              <dl>
                <dt>Hard to leave</dt><dd>The product runs core work, so leaving is painful (payroll, books, billing)</dd>
                <dt>Grows with users</dt><dd>Each new user makes it better for everyone else (marketplaces)</dd>
                <dt>Cheaper at size</dt><dd>More volume makes it cheaper to run (data centers, clinics)</dd>
                <dt>Learns from use</dt><dd>Usage makes the product smarter (AI trained on real work)</dd>
              </dl>
              <p>Speed, brand, funding and famous founders help a company get going, but they don&apos;t count as an edge.</p>
              <p><b>2. Proof (+):</b> public evidence that the edge works: net revenue retention over 110% or low churn, a second product customers actually use, raising prices without losing customers, and no reliance on a few giant accounts.</p>
              <p><b>3. Exposure (−):</b> platform risk (it runs on a rival&apos;s system), clone risk (big AI labs or incumbents can ship the same thing) and burn risk (growth only lasts while new money keeps coming).</p>
              <p><b>Rating starts with market position:</b> Marathon (42 km) = category leader with a lasting edge and proof at scale · Half (21 km) = a leader or strong #2–3 with broad adoption · 10K = behind bigger rivals, easy to copy, or exposed · Unproven = too early to tell. Missing data counts as neutral, not as a strike. Every rating links its public sources; open a company to see them.</p>
            </div>
          </details>
        </div>
      </div>
    </>
  );
}
