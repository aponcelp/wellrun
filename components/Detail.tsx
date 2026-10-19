"use client";
import type { ReactNode } from "react";
import type { Company, Source } from "@/lib/types";
import { checkedOf, gdOf, has, opsOf, plainEngine } from "@/lib/rank";
import { cap } from "@/lib/track";

function Block({ label, mod, children }: { label: string; mod?: string; children: ReactNode }) {
  return (
    <div className={"d-b" + (mod ? " " + mod.split(" ").map((m) => "d-b--" + m).join(" ") : "")}>
      <p className="d-k">{label}</p>
      {children}
    </div>
  );
}

/** The full company card: used inline on the board and on each company's own page. */
export default function Detail({ c }: { c: Company }) {
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
  const trend = [
    has(c.hiring_trend) && String(c.hiring_trend),
    String(c.total_open_roles ?? "").trim() && "open roles " + String(c.total_open_roles).trim(),
    has(c.headcount) && "headcount " + c.headcount,
  ].filter(Boolean).join(" · ");
  const newsText = has(c.latest_news) ? c.latest_news + (has(c.latest_news_date) ? ` (${c.latest_news_date})` : "") : "";
  let gdText: string;
  if (gd) gdText = `${gd} ★` + (has(c.glassdoor_reviews) ? ` (${c.glassdoor_reviews} reviews)` : "");
  else if (has(c.glassdoor_rating)) gdText = /^</.test(String(c.glassdoor_rating).trim()) ? "Fewer than 5 reviews, no rating yet" : String(c.glassdoor_rating);
  else gdText = "No rating yet";
  const funding = [c.stage, c.last_round, c.last_round_date, c.lead_investors].filter(has).join(" · ");
  const locs = c.hiring_locations || [];

  return (
    <>
      <div className="d-grid">
        {has(c.problem) && (
          <Block label="The problem">
            <p>{c.problem}</p>
          </Block>
        )}
        {(has(c.what_they_do) || has(c.traction)) && (
          <Block label="What they do">
            {has(c.what_they_do) && <p>{c.what_they_do}</p>}
            {has(c.traction) && <p className="d-note">{c.traction}</p>}
          </Block>
        )}
        {trend && (
          <Block label="Hiring trend">
            <p>{trend}</p>
          </Block>
        )}
        {locs.length > 0 && (
          <Block label="Hiring in">
            <p>{locs.join(" · ")}</p>
          </Block>
        )}
        {newsText && (
          <Block label="Latest news">{has(c.latest_news_url) ? ext(c.latest_news_url, newsText + " ↗") : <p>{newsText}</p>}</Block>
        )}
        <Block label="Glassdoor">
          {has(c.glassdoor_url) ? ext(c.glassdoor_url, gdText + " ↗") : <p className={gd ? "" : "d-note"}>{gdText}</p>}
        </Block>
        {funding && (
          <Block label="Funding">
            <p>{funding}</p>
          </Block>
        )}
        {has(c.distance) && (
          <Block label="Distance" mod="wide">
            <p>
              <b>{c.distance}</b>
              {has(c.engine) && c.engine !== "None yet" ? " · edge: " + plainEngine(c.engine) : ""}
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
        <Block label="Open ops roles" mod="wide">
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
