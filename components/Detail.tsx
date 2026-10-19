"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Card, Source } from "@/lib/types";
import { checkedOf, gdOf, has, opsOf, plainEngine } from "@/lib/rank";
import { cap } from "@/lib/track";
import RivalTrack from "./RivalTrack";
import ScoreBuilt from "./ScoreBuilt";
import Shot from "./Shot";

/** One tile of the card: a label, then its content. Same blocks, in the same order, as the original site's card. */
function Block({ label, mod, children }: { label: string; mod?: string; children: ReactNode }) {
  return (
    <div className={"d-b" + (mod ? " " + mod.split(" ").map((m) => "d-b--" + m).join(" ") : "")}>
      <p className="d-k">{label}</p>
      {children}
    </div>
  );
}

/** A compact label/value row inside a tile; `big` sets the value in condensed numerals. */
function Fact({ k, v, big }: { k: string; v: ReactNode; big?: boolean }) {
  return (
    <div className="d-f">
      <dt>{k}</dt>
      <dd className={big ? "d-big" : ""}>{v}</dd>
    </div>
  );
}

/** "644 open roles; S-1 filed, …" → "S-1 filed, …" (the count is shown on its own). */
const trendNote = (t: string) =>
  t
    .replace(/^\s*~?[\d,]+\+?\s+open\s+roles?\s*[;,.:·-]?\s*/i, "")
    .replace(/^\s*[;,.]\s*/, "")
    .trim();

/** What the full profile holds, in a few words, so the button promises something concrete. */
export function teaser(c: Card): string[] {
  const e = c.enrich;
  const out: string[] = [];
  if (e?.leadership?.length) out.push(`${e.leadership.length} ${e.leadership.length === 1 ? "leader" : "leaders"}`);
  if (e?.funding_history?.length) out.push(`${e.funding_history.length} funding ${e.funding_history.length === 1 ? "round" : "rounds"}`);
  if (e?.revenue_est?.value) out.push("revenue estimate");
  if (e?.news_timeline?.length) out.push("news timeline");
  if (!out.length) out.push("pace track", "score breakdown", "shareable page");
  return out;
}

/** The big "open the full profile" button used in the expanded card. */
export function ProfileButton({ c, where }: { c: Pick<Card, "name" | "slug">; where: "top" | "bottom" }) {
  return (
    <Link
      href={`/${c.slug}`}
      prefetch={false}
      className={"btn-profile btn-profile--" + where}
      onClick={(e) => cap("company_link_clicked", { company: c.name, role: "", url: e.currentTarget.href })}
    >
      Open {c.name}&apos;s full profile <span aria-hidden="true">→</span>
    </Link>
  );
}

/** The full company card: used inline on the board ("card") and on each company's own page ("page"). */
export default function Detail({ c, variant = "card" }: { c: Card; variant?: "card" | "page" }) {
  const ext = (url: string, text: ReactNode, key?: string | number) => (
    <a
      key={key}
      className="d-link"
      href={url}
      target="_blank"
      rel="noopener"
      onClick={() => cap("company_link_clicked", { company: c.name, role: "", url })}
    >
      {text}
    </a>
  );
  const sources = (list: Source[] | undefined) => {
    const ok = (Array.isArray(list) ? list : []).filter((s) => s && s.url);
    if (!ok.length) return null;
    return (
      <p className="d-src">
        Sources:{" "}
        {ok.map((s, i) => (
          <span key={i}>
            {i > 0 && " · "}
            {ext(s.url as string, (s.label || "Source") + " ↗")}
          </span>
        ))}
      </p>
    );
  };
  const ops = opsOf(c);
  const gd = gdOf(c);
  const open = String(c.total_open_roles ?? "").trim();
  const note = has(c.hiring_trend) ? (open ? trendNote(String(c.hiring_trend)) : String(c.hiring_trend).trim()) : "";
  const hasTrend = !!(open || note || has(c.headcount));
  const locs = c.hiring_locations || [];

  // Glassdoor only takes a tile when there is something to say.
  let gdNode: ReactNode = null;
  if (gd) {
    const t = (
      <>
        <span className="d-big">{gd} ★</span>
        {has(c.glassdoor_reviews) && <span className="d-sub"> {c.glassdoor_reviews} reviews</span>}
      </>
    );
    gdNode = has(c.glassdoor_url) ? ext(c.glassdoor_url, <>{t} ↗</>) : <p>{t}</p>;
  } else if (has(c.glassdoor_rating) && /^</.test(String(c.glassdoor_rating).trim())) {
    const t = "Fewer than 5 reviews, no rating yet";
    gdNode = has(c.glassdoor_url) ? ext(c.glassdoor_url, t + " ↗") : <p className="d-note">{t}</p>;
  } else if (has(c.glassdoor_url)) {
    gdNode = ext(c.glassdoor_url, "No rating yet · see Glassdoor ↗");
  }

  const hasFunding = [c.stage, c.last_round, c.last_round_date, c.lead_investors].some(has);

  const rivals = c.rivals;
  const showTrack = variant === "card" && !!rivals && rivals.track.length > 1;

  return (
    <>
      {variant === "card" && (
        <div className={"d-cta" + (c.og ? "" : " d-cta--noimg")}>
          {c.og && (
            <Link href={`/${c.slug}`} prefetch={false} className="d-cta__img" tabIndex={-1} aria-hidden="true">
              <Shot og={c.og} name={c.name} />
            </Link>
          )}
          <div className="d-cta__body">
            <p className="d-cta__k">Well Run profile</p>
            <p className="d-cta__t">{teaser(c).join(" · ")}</p>
            <ProfileButton c={c} where="top" />
          </div>
        </div>
      )}
      <div className="d-grid">
        {has(c.problem) && (
          <Block label="The problem">
            <p>{c.problem}</p>
          </Block>
        )}
        {(has(c.what_they_do) || has(c.traction)) && (
          <Block label="What they do">
            {has(c.what_they_do) && <p>{c.what_they_do}</p>}
            {has(c.traction) && (
              <p className="d-traction">
                <span className="d-tag">Traction</span> {c.traction}
              </p>
            )}
          </Block>
        )}
        {hasTrend && (
          <Block label="Hiring trend">
            <dl className="d-facts">
              {open && <Fact k="Open roles" v={open} big />}
              {ops.length > 0 && <Fact k="Ops roles" v={ops.length} big />}
              {has(c.headcount) && <Fact k="Headcount" v={c.headcount} />}
            </dl>
            {note && <p className="d-note">{note}</p>}
          </Block>
        )}
        {locs.length > 0 && (
          <Block label="Hiring in">
            <ul className="d-locs">
              {locs.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </Block>
        )}
        {has(c.latest_news) && (
          <Block label="Latest news">
            {has(c.latest_news_date) && <p className="d-date">{c.latest_news_date}</p>}
            {has(c.latest_news_url) ? ext(c.latest_news_url, c.latest_news + " ↗") : <p>{c.latest_news}</p>}
          </Block>
        )}
        {gdNode && <Block label="Glassdoor">{gdNode}</Block>}
        {hasFunding && (
          <Block label="Funding">
            <dl className="d-facts">
              {has(c.last_round) && <Fact k="Last round" v={c.last_round} big />}
              {has(c.stage) && <Fact k="Stage" v={c.stage} />}
              {has(c.last_round_date) && <Fact k="Date" v={c.last_round_date} />}
            </dl>
            {has(c.lead_investors) && (
              <p className="d-note">
                <span className="d-tag">Led by</span> {c.lead_investors}
              </p>
            )}
          </Block>
        )}
        {showTrack && rivals && (
          <Block label="Rivals on the track" mod="wide track">
            <RivalTrack track={rivals.track} off={rivals.off} hi={rivals.hi} compact />
          </Block>
        )}
        <div className="d-b d-b--wide d-b--score">
          <ScoreBuilt c={c} />
        </div>
        {has(c.distance) && (
          <Block label="Distance" mod="wide">
            <p className="d-dist">
              <b>{c.distance}</b>
              {has(c.engine) && c.engine !== "None yet" && <span className="d-sub"> · edge: {plainEngine(c.engine)}</span>}
            </p>
            {has(c.distance_why) && <p>{c.distance_why}</p>}
            {sources(c.distance_sources)}
          </Block>
        )}
        {has(c.red_flags) && (
          <Block label="Watch-outs" mod="warn wide">
            <p>{c.red_flags}</p>
            {sources(c.red_flags_sources)}
          </Block>
        )}
        <Block label={ops.length ? `Open ops roles · ${ops.length}` : "Open ops roles"} mod="wide roles">
          {ops.length ? (
            <ul className="d-roles" aria-label={`Open ops roles at ${c.name}`}>
              {ops.map((t, i) => (
                <li key={i}>
                  {has(c.careers_url) ? (
                    <a
                      href={c.careers_url}
                      target="_blank"
                      rel="noopener"
                      onClick={() => cap("careers_clicked", { company: c.name, role: t, url: c.careers_url })}
                    >
                      <b>{t}</b> <span className="d-apply">Careers ↗</span>
                    </a>
                  ) : (
                    <span className="d-role">
                      <b>{t}</b>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="d-note">No ops roles open right now</p>
          )}
        </Block>
      </div>
      <p className="d-checked">Last checked {checkedOf(c)}</p>
    </>
  );
}
