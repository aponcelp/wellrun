"use client";
import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Company, Row } from "@/lib/types";
import { BUCKET_ORDER, DISTS, SORTS, SORT_KEYS, SORT_NOTE, STAGES, toSortKey, ZONES, fmtScore, hostOf, type SortKey } from "@/lib/rank";
import { cap } from "@/lib/track";
import { reportError } from "@/lib/monitoring";
import Detail from "./Detail";
import { DistMark, ZoneMark } from "./Marks";
import Logo from "./Logo";
import CopyLink from "./CopyLink";

type FilterKey = "chart" | "industry" | "stage" | "zone" | "dist";
type State = { hiring: boolean; chart: string; industry: string; stage: string; zone: string; dist: string; sort: SortKey; q: string };
const INITIAL: State = { hiring: false, chart: "All", industry: "All", stage: "All", zone: "All", dist: "All", sort: "fastest", q: "" };
// Group ids match the original site's chip containers, so filter_changed{group} stays comparable.
const GROUP_ID: Record<FilterKey, string> = { chart: "charts", industry: "industries", stage: "stages", zone: "zones", dist: "dists" };
const ZONE_LABEL: Record<string, string> = Object.fromEntries(ZONES.map((z) => [z.key, z.name]));
const SORT_LABEL: Record<SortKey, string> = { fastest: "Pace", distance: "Distance" };

type Detail = Company | "loading" | "error";

export default function Board({ rows }: { rows: Row[] }) {
  const [s, setS] = useState<State>(INITIAL);
  const [page, setPage] = useState(25);
  const [shown, setShown] = useState(25);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const [details, setDetails] = useState<Record<string, Detail>>({});
  const [version, setVersion] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const qTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loading = useRef<Set<string>>(new Set());

  const industries = useMemo(() => ["All"].concat(BUCKET_ORDER.filter((b) => rows.some((r) => r.bucket === b))), [rows]);
  const sorted = useMemo(() => rows.slice().sort(SORTS[s.sort]), [rows, s.sort]);
  const pos = useMemo(() => {
    const m = new Map<string, number>();
    sorted.forEach((r, i) => m.set(r.slug, i + 1));
    return m;
  }, [sorted]);

  const q = s.q.trim().toLowerCase();
  const list = useMemo(
    () =>
      sorted.filter(
        (r) =>
          (!s.hiring || r.ops > 0) &&
          (s.chart === "All" || (s.chart === "Well Run 100" ? r.rank <= 100 : r.rank > 100)) &&
          (s.industry === "All" || r.bucket === s.industry) &&
          (s.stage === "All" || r.stage === s.stage) &&
          (s.zone === "All" || r.zone === s.zone) &&
          (s.dist === "All" || r.distance === s.dist) &&
          (!q || r.hay.includes(q)),
      ),
    [sorted, s, q],
  );

  /** Any change to what's listed starts back at the first page and fades the list in. */
  const update = useCallback((patch: Partial<State>) => {
    setS((prev) => ({ ...prev, ...patch }));
    setShown(page);
    setVersion((v) => v + 1);
  }, [page]);

  const pickFilter = (key: FilterKey, v: string) => {
    cap("filter_changed", { group: GROUP_ID[key], value: v });
    update({ [key]: v !== "All" && s[key] === v ? "All" : v } as Partial<State>);
  };
  const pickSort = (v: SortKey, from: "sorts" | "column") => {
    if (from === "column") cap("sort_changed", { group: "column", value: v });
    // The original column buttons forwarded a click to the matching sort chip, which logged it again.
    cap("sort_changed", { group: "sorts", value: v });
    update({ sort: toSortKey(v) });
  };
  const toggleHiring = () => {
    const next = !s.hiring;
    cap("filter_changed", { group: "hiring_ops", value: next ? "on" : "off" });
    update({ hiring: next });
  };
  const reset = () => {
    cap("filters_reset");
    update({ hiring: false, chart: "All", industry: "All", stage: "All", zone: "All", dist: "All", q: "" });
  };
  const onSearch = (v: string) => {
    update({ q: v });
    if (qTimer.current) clearTimeout(qTimer.current);
    qTimer.current = setTimeout(() => {
      const t = v.trim();
      if (t.length > 1) cap("searched", { query: t.slice(0, 60) });
    }, 1200);
  };
  useEffect(() => () => {
    if (qTimer.current) clearTimeout(qTimer.current);
  }, []);

  const load = useCallback((slug: string) => {
    if (loading.current.has(slug)) return;
    loading.current.add(slug);
    setDetails((d) => (d[slug] && d[slug] !== "error" ? d : { ...d, [slug]: "loading" }));
    fetch(`/d/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((c: Company) => setDetails((d) => ({ ...d, [slug]: c })))
      .catch((err) => {
        reportError(err, { where: "board.details", slug });
        loading.current.delete(slug);
        setDetails((d) => ({ ...d, [slug]: "error" }));
      });
  }, []);

  /** Logo/name links: let the browser follow the link (no preventDefault), just keep the row from toggling. */
  const siteClick = (r: Row) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    cap("company_site_clicked", { company: r.name });
  };

  const toggle = (r: Row) => {
    const now = !open.has(r.slug);
    setOpen((prev) => {
      const n = new Set(prev);
      if (now) n.add(r.slug);
      else n.delete(r.slug);
      return n;
    });
    if (now) {
      cap("company_opened", { company: r.name });
      load(r.slug);
    }
  };

  const jump = (chart: string) => {
    if (s.chart !== chart) pickFilter("chart", chart);
    const el = listRef.current;
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 120;
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top, behavior: still ? "auto" : "smooth" });
    }
  };

  const chartMode = s.sort === "fastest" && !s.hiring && !q && [s.industry, s.stage, s.zone, s.dist].every((v) => v === "All");
  const total = rows.length;
  const filterCount = [s.hiring, s.chart !== "All", s.industry !== "All", s.stage !== "All", s.zone !== "All", s.dist !== "All"].filter(Boolean).length;
  const advCount = [s.hiring, s.chart !== "All", s.industry !== "All", s.stage !== "All", s.dist !== "All"].filter(Boolean).length;
  const active = filterCount > 0 || !!q;
  const left = list.length - shown;

  const chips = (key: FilterKey, values: string[], label: (v: string) => string) => (
    <div className="chips" role="group" aria-label={key}>
      {values.map((v) => (
        <button
          key={v}
          type="button"
          className={"chip" + (key === "zone" && v !== "All" ? ` chip--zone z-${v}` : "")}
          aria-pressed={s[key] === v}
          onClick={() => pickFilter(key, v)}
        >
          {key === "zone" && v !== "All" && <i className="zm__tok" aria-hidden="true" />}
          {label(v)}
        </button>
      ))}
    </div>
  );

  const sortButtons = (from: "sorts" | "column", cls: string) =>
    SORT_KEYS.map((k) => (
      <button
        key={k}
        type="button"
        className={cls}
        aria-pressed={s.sort === k}
        aria-label={from === "column" ? `Sort by ${SORT_LABEL[k]}` : undefined}
        onClick={() => pickSort(k, from)}
      >
        {SORT_LABEL[k]}
        {from === "column" && <i className="cols__arr" aria-hidden="true">{s.sort === k ? "↓" : "↕"}</i>}
      </button>
    ));

  const top100 = (
    <li className="chartline chartline--top" key="top100">
      <h2 className="chartline__title">The Well Run 100</h2>
      <p className="chartline__sub">the top 100 by Pace, re-ranked every Sunday</p>
      <button type="button" className="chartline__jump" onClick={() => jump("Chase Pack")}>
        See the Chase Pack ↓
      </button>
    </li>
  );
  const chase = (first: boolean) => (
    <li className={"chartline chartline--chase" + (first ? " chartline--top" : "")} key="chase">
      <h2 className="chartline__title">The Chase Pack</h2>
      <p className="chartline__sub">ranks 101 to {total}, chasing the top 100 · re-ranked every Sunday</p>
      <button type="button" className="chartline__jump" onClick={() => jump("Well Run 100")}>
        Back to the Well Run 100 ↑
      </button>
    </li>
  );

  const visible = list.slice(0, shown);

  return (
    <section className="board" id="run" aria-label="Today's run">
      <div className={"controls" + (filtersOpen ? " is-open" : "")} role="search" aria-label="Filter companies">
        <div className="controls__bar">
          <label className="search">
            <span className="sr-only">Search</span>
            <svg viewBox="0 0 20 20" aria-hidden="true" className="search__icon">
              <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              id="q"
              type="search"
              placeholder="Name, product, problem or city"
              autoComplete="off"
              spellCheck={false}
              value={s.q}
              onChange={(e) => onSearch(e.target.value)}
            />
          </label>
        </div>
        <div className="fbar">
          <span className="fbar__k" id="fbar-k">Filter by zone</span>
          <div className="fbar__zones" role="group" aria-labelledby="fbar-k">
            {ZONES.map((z) => (
              <button
                key={z.key}
                type="button"
                className={`ztog z-${z.key}`}
                aria-pressed={s.zone === z.key}
                onClick={() => pickFilter("zone", z.key)}
              >
                <i className="zm__tok" aria-hidden="true" />
                {z.name}
              </button>
            ))}
          </div>
          <div className="fbar__end">
            <button
              type="button"
              className="fmore-btn"
              aria-expanded={filtersOpen}
              aria-controls="fmore"
              onClick={() => {
                cap("filters_toggled");
                setFiltersOpen((o) => !o);
              }}
            >
              <span className="fmore-btn__mark" aria-hidden="true">{filtersOpen ? "−" : "+"}</span>
              More filters
              {advCount > 0 && <b>{advCount}</b>}
            </button>
            {active && (
              <button type="button" className="fclear" onClick={reset}>
                Clear <span aria-hidden="true">×</span>
              </button>
            )}
          </div>
        </div>
        <div className="fmore" id="fmore" hidden={!filtersOpen}>
          <div className="frow">
            <span className="frow__k">Stage</span>
            {chips("stage", STAGES, (v) => (v === "All" ? "Any" : v))}
          </div>
          <div className="frow">
            <span className="frow__k">Hiring</span>
            <div className="chips">
              <button type="button" className="chip" id="hiring" aria-pressed={s.hiring} onClick={toggleHiring}>
                Hiring ops
              </button>
            </div>
          </div>
          <div className="frow">
            <span className="frow__k">Distance</span>
            {chips("dist", ["All"].concat(DISTS), (v) => v)}
          </div>
          <div className="frow">
            <span className="frow__k">Chart</span>
            {chips("chart", ["All", "Well Run 100", "Chase Pack"], (v) => v)}
          </div>
          <div className="frow">
            <span className="frow__k">Industry</span>
            {chips("industry", industries, (v) => v)}
          </div>
        </div>
        <div className="sortbar">
          <h2 className="sortbar__h">Today&apos;s splits</h2>
          <div className="sortby" role="group" aria-labelledby="sortby-k">
            <span className="sortby__k" id="sortby-k">Sort by</span>
            <span className="sortby__seg">{sortButtons("sorts", "sortby__b")}</span>
          </div>
          <span className="sortbar__note">{SORT_NOTE[s.sort]}</span>
          {active && (
            <output className="sortbar__count" aria-live="polite">
              {list.length} {list.length === 1 ? "match" : "matches"}
            </output>
          )}
        </div>
      </div>

      <div className="cols">
        <span>Pos</span>
        <span>Company</span>
        {sortButtons("column", "cols__b")}
        <span className="cols__h">Hiring</span>
        <span className="sr-only">Details</span>
      </div>

      <ol className="chart" id="log" ref={listRef} key={version}>
        {visible.map((r, i) => {
          const isOpen = open.has(r.slug);
          const p = pos.get(r.slug) || 0;
          const d = details[r.slug];
          const pid = `p-${r.slug}`;
          return [
            chartMode && i === 0 && s.chart !== "Chase Pack" ? top100 : null,
            chartMode && i === 0 && s.chart === "Chase Pack" ? chase(true) : null,
            chartMode && i === 100 && s.chart === "All" ? chase(false) : null,
            <li
              key={r.slug}
              className={"row" + (isOpen ? " is-open" : "") + (p === 1 && s.sort === "fastest" ? " row--lead" : "")}
              onPointerEnter={() => load(r.slug)}
              style={i < 30 ? { animationDelay: `${Math.min(i, 12) * 18}ms` } : undefined}
            >
              <div className="row__bar">
                {/* A div with button semantics (not a <button>) so the logo and name can be real links:
                    anchors nested in a <button> are invalid and iOS Safari routes the tap to the button. */}
                <div
                  role="button"
                  tabIndex={0}
                  className="row__main"
                  aria-expanded={isOpen}
                  aria-controls={pid}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a")) return;
                    toggle(r);
                  }}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(r);
                    }
                  }}
                >
                  <span className="row__pos">
                    <i className={"row__dot" + (r.ops > 0 ? " on" : "")} aria-hidden="true" />
                    <span className="sr-only">Position </span>
                    {p}
                    {r.ops > 0 && <span className="sr-only">, hiring ops</span>}
                  </span>
                  <span className="row__who">
                    {r.site ? (
                      <a className="row__site row__site--logo" href={r.site} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" onClick={siteClick(r)}>
                        <Logo name={r.name} host={r.host} />
                      </a>
                    ) : (
                      <Logo name={r.name} host={r.host} />
                    )}
                    <span className="row__txt">
                      {r.site ? (
                        <a className="row__name row__site" href={r.site} target="_blank" rel="noopener noreferrer" onClick={siteClick(r)}>
                          {r.name}
                          <span className="sr-only"> (website, opens in a new tab)</span>
                        </a>
                      ) : (
                        <span className="row__name">{r.name}</span>
                      )}
                      <span className="row__what">{r.what}</span>
                      <span className="row__meta">
                        <DistMark distance={r.distance} compact />
                        {r.ops > 0 && <span className="row__ops">{r.ops} ops</span>}
                        {r.gd && <span className="row__gd">★ {r.gd}</span>}
                      </span>
                      {r.locs.length > 0 && <span className="row__loc"><span className="sr-only">Hiring in </span>{r.locs.join(" · ")}</span>}
                    </span>
                  </span>
                  <span className="row__pace">
                    <span className="sr-only">Pace {ZONE_LABEL[r.zone]}, momentum score {r.scoreRaw}.</span>
                    <span aria-hidden="true">
                      <ZoneMark zone={r.zone} score={fmtScore(r.score)} split meter />
                    </span>
                  </span>
                  <span className="row__dist">
                    <DistMark distance={r.distance} />
                  </span>
                  <span className="row__roles">
                    {r.ops > 0 ? (
                      <span className="row__opsn">
                        <b>{r.ops}</b> ops {r.ops === 1 ? "role" : "roles"}
                      </span>
                    ) : (
                      <span className="row__none">—</span>
                    )}
                    {r.gd && (
                      <span className="row__gd">
                        <span aria-hidden="true">★ {r.gd}{r.gdReviews ? " · " + r.gdReviews : ""}</span>
                        <span className="sr-only">Glassdoor {r.gd} stars{r.gdReviews ? `, ${r.gdReviews} reviews` : ""}</span>
                      </span>
                    )}
                  </span>
                  <span className="row__more" aria-hidden="true">
                    <span className="row__more-t">{isOpen ? "Close" : "Details"}</span>
                    <i className="row__chev" />
                  </span>
                </div>
              </div>
              <div className="sheet" id={pid} hidden={!isOpen}>
                {isOpen && (
                  <div className="sheet__in">
                    <button type="button" className="xclose sheet__close" onClick={() => toggle(r)} aria-label={`Close ${r.name} details`}>
                      Close <span aria-hidden="true">×</span>
                    </button>
                    {d && d !== "loading" && d !== "error" ? (
                      <Detail c={d} />
                    ) : d === "error" ? (
                      <p className="d-note">Couldn&apos;t load the details. Open the full page below.</p>
                    ) : (
                      <div className="sheet__skel" aria-label="Loading">
                        <i />
                        <i />
                        <i />
                      </div>
                    )}
                    <div className="sheet__links">
                      <span className="sheet__share">
                        <Link
                          href={`/${r.slug}`}
                          prefetch={false}
                          onClick={(e) => cap("company_link_clicked", { company: r.name, role: "", url: e.currentTarget.href })}
                        >
                          {r.name}&apos;s Well Run page <small>(shareable link)</small> →
                        </Link>
                        <CopyLink slug={r.slug} name={r.name} />
                      </span>
                      {r.site && (
                        <a
                          href={r.site}
                          target="_blank"
                          rel="noopener"
                          aria-label={`${hostOf(r.site) || r.name + " website"} (opens ${r.name}'s own site)`}
                          onClick={() => cap("company_link_clicked", { company: r.name, role: "", url: r.site })}
                        >
                          {hostOf(r.site) || "Website"} ↗
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </li>,
          ];
        })}
      </ol>

      {list.length > 25 && (
        <div className="pager">
          <span className="pager__info">
            Showing 1–{Math.min(shown, list.length)} of {list.length}
          </span>
          <span className="seg" role="group" aria-label="Rows per page">
            <span className="seg__k">Show</span>
            {[25, 50, 100].map((n) => (
              <button
                key={n}
                type="button"
                className="seg__b"
                aria-pressed={page === n}
                onClick={() => {
                  setPage(n);
                  setShown(n);
                }}
              >
                {n}
              </button>
            ))}
          </span>
          {left > 0 && (
            <button
              type="button"
              className="pager__next"
              id="morebtn"
              onClick={() => {
                cap("show_more");
                setShown((x) => x + page);
              }}
            >
              Next {Math.min(page, left)}
            </button>
          )}
        </div>
      )}

      {list.length === 0 && (
        <div className="empty">
          <p>0 companies matched · exit 1</p>
          <button type="button" className="chip" onClick={reset}>
            Reset filters
          </button>
        </div>
      )}
    </section>
  );
}
