"use client";
import type { ReactNode } from "react";
import type { Enrichment } from "@/lib/types";
import { monthLabel } from "@/lib/score";
import { hostOf } from "@/lib/rank";
import { cap } from "@/lib/track";

/** A small "source ↗" link: every enrichment fact keeps its source. */
function Src({ url, label, co }: { url?: string | null; label?: string; co: string }) {
  if (!url) return null;
  return (
    <a className="pf-src" href={url} target="_blank" rel="noopener" title={url} onClick={() => cap("company_link_clicked", { company: co, role: "", url })}>
      {label || hostOf(url) || "source"} ↗
    </a>
  );
}

function Sec({ id, title, children, sub }: { id: string; title: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <section className="pf-sec" aria-labelledby={id}>
      <h2 className="pf-h" id={id}>
        {title}
        {sub && <small>{sub}</small>}
      </h2>
      {children}
    </section>
  );
}

/** "At a glance": founded, HQ, headcount, revenue estimate and total raised, each with as-of and source. */
export function Glance({ e, name }: { e: Enrichment; name: string }) {
  const items: { k: string; v: ReactNode; meta?: ReactNode }[] = [];
  if (e.revenue_est?.value && e.revenue_est.as_of)
    items.push({
      k: "Revenue estimate",
      v: e.revenue_est.value,
      meta: (
        <>
          {[e.revenue_est.basis, `as of ${monthLabel(e.revenue_est.as_of)}`].filter(Boolean).join(" · ")} <Src co={name} url={e.revenue_est.source} />
        </>
      ),
    });
  if (e.total_raised) items.push({ k: "Total raised", v: e.total_raised, meta: e.funding_history?.length ? <a className="pf-src" href="#pf-funding">see rounds ↓</a> : undefined });
  if (e.headcount_est?.value)
    items.push({
      k: "Headcount",
      v: e.headcount_est.value,
      meta: (
        <>
          {e.headcount_est.as_of ? `as of ${monthLabel(e.headcount_est.as_of)}` : ""} <Src co={name} url={e.headcount_est.source} />
        </>
      ),
    });
  if (e.founded) items.push({ k: "Founded", v: String(e.founded) });
  if (e.hq) items.push({ k: "HQ", v: e.hq });
  if (!items.length) return null;
  return (
    <dl className="pf-glance">
      {items.map((it) => (
        <div key={it.k} className={"pf-g" + (it.k === "Revenue estimate" ? " pf-g--rev" : "")}>
          <dt>{it.k}</dt>
          <dd>
            <span className="pf-g__v">{it.v}</span>
            {it.meta && <span className="pf-g__m">{it.meta}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Leadership({ e, name }: { e: Enrichment; name: string }) {
  const list = e.leadership || [];
  if (!list.length) return null;
  return (
    <Sec id="pf-lead" title="Leadership">
      <ul className="pf-people">
        {list.map((p) => (
          <li key={p.name + p.title}>
            <span className="pf-av" aria-hidden="true">
              {p.name
                .split(/\s+/)
                .map((w) => w.charAt(0))
                .slice(0, 2)
                .join("")}
            </span>
            <span className="pf-pp">
              <b>{p.name}</b>
              {p.founder && <span className="pf-tag">Founder</span>}
              <span className="pf-pt">{p.title}</span>
              <span className="pf-pl">
                {p.linkedin && (
                  <a href={p.linkedin} target="_blank" rel="noopener" onClick={() => cap("company_link_clicked", { company: name, role: "", url: p.linkedin as string })}>
                    LinkedIn ↗
                  </a>
                )}
                <Src co={name} url={p.source} label="source" />
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Sec>
  );
}

export function FundingHistory({ e, name }: { e: Enrichment; name: string }) {
  const list = (e.funding_history || []).slice().reverse(); // newest first
  if (!list.length) return null;
  return (
    <Sec id="pf-funding" title="Funding history" sub={e.total_raised ? `Total raised ${e.total_raised}` : undefined}>
      <ol className="pf-tl">
        {list.map((f, i) => (
          <li key={i} className={i === 0 ? "is-latest" : ""}>
            <span className="pf-tl__d">{monthLabel(f.date)}</span>
            <span className="pf-tl__b">
              <span className="pf-tl__h">
                <b>{f.round}</b>
                {f.amount && <span className="pf-amt">{f.amount}</span>}
                {f.valuation && <span className="pf-val">at {f.valuation}</span>}
              </span>
              {(f.lead || f.source) && (
                <span className="pf-tl__m">
                  {f.lead && <>Led by {f.lead} </>}
                  <Src co={name} url={f.source} />
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </Sec>
  );
}

export function NewsTimeline({ e, name }: { e: Enrichment; name: string }) {
  const list = e.news_timeline || [];
  if (!list.length) return null;
  return (
    <Sec id="pf-news" title="News timeline">
      <ol className="pf-tl pf-tl--news">
        {list.map((n, i) => (
          <li key={i}>
            <span className="pf-tl__d">{monthLabel(n.date)}</span>
            <span className="pf-tl__b">
              {n.url ? (
                <a className="pf-news" href={n.url} target="_blank" rel="noopener" onClick={() => cap("company_link_clicked", { company: name, role: "", url: n.url })}>
                  {n.headline} <span className="pf-src">{hostOf(n.url)} ↗</span>
                </a>
              ) : (
                <span>{n.headline}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </Sec>
  );
}
