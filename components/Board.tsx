"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Company, Row } from "@/lib/types";
import { BUCKET_ORDER, DISTS, SORTS, SORT_NOTE, STAGES, ZONES, fmtScore, slugify, type SortKey } from "@/lib/rank";
import { cap } from "@/lib/track";
import { reportError } from "@/lib/monitoring";
import Detail from "./Detail";
import { DistMark, ZoneMark } from "./Marks";
import Logo from "./Logo";

type FilterKey = "chart" | "industry" | "stage" | "zone" | "dist";
type State = { hiring: boolean; chart: string; industry: string; stage: string; zone: string; dist: string; sort: SortKey; q: string };
const INITIAL: State = { hiring: false, chart: "All", industry: "All", stage: "All", zone: "All", dist: "All", sort: "fastest", q: "" };
// Group ids match the original site's chip containers, so filter_changed{group} stays comparable.
const GROUP_ID: Record<FilterKey, string> = { chart: "charts", industry: "industries", stage: "stages", zone: "zones", dist: "dists" };
const ZONE_LABEL: Record<string, string> = Object.fromEntries(ZONES.map((z) => [z.key, z.name]));
const SORT_LABEL: Record<SortKey, string> = { fastest: "Pace", distance: "Distance", hiring: "Hiring" };

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
    update({ sort: v });
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
  const advCount = [s.hiring, s.chart !== "All", s.industry !== "All", s.dist !== "All"].filter(Boolean).length;
  const active = filterCount > 0 || !!q;
  const left = list.length - shown;

  let cmd = "$ well_run";
  if (s.hiring) cmd += " --hiring-ops";
  if (s.chart !== "All") cmd += " --chart=" + slugify(s.chart);
  if (s.zone !== "All") cmd += " --zone=" + s.zone;
  if (s.dist !== "All") cmd += " --distance=" + slugify(s.dist);
  if (s.industry !== "All") cmd += " --industry=" + slugify(s.industry);
  if (s.stage !== "All") cmd += " --stage=" + slugify(s.stage);
  if (s.sort !== "fastest") cmd += " --sort=" + s.sort;
  if (s.q.trim()) cmd += ` | grep -i "${s.q.trim()}"`;

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
    (["fastest", "distance", "hiring"] as SortKey[]).map((k) => (
      <button key={k} type="button" className={cls} aria-pressed={s.sort === k} onClick={() => pickSort(k, from)}>
        {SORT_LABEL[k]}
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
      <p className="chartline__sub">
        #101 to #{total}, chasing the top 100
      </p>
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
          <button
            type="button"
            className="ftoggle"
            aria-expanded={filtersOpen}
            aria-controls="fmore"
            onClick={() => {
              cap("filters_toggled");
              setFiltersOpen((o) => !o);
            }}
          >
            Filters{filterCount > 0 && <b>{filterCount}</b>}
            <i aria-hidden="true">+</i>
          </button>
        </div>
        <div className="sortbar">
          <h2 className="sortbar__h">Today&apos;s splits</h2>
          <div className="seg" role="group" aria-label="Sort by">
            <span className="seg__k">Sort</span>
            {sortButtons("column", "seg__b")}
          </div>
          <span className="sortbar__note">{SORT_NOTE[s.sort]}</span>
          {active && (
            <output className="sortbar__count" aria-live="polite">
              {list.length} {list.length === 1 ? "match" : "matches"}
            </output>
          )}
        </div>
        <div className="fmore" id="fmore" hidden={!filtersOpen}>
          <div className="frow">
            <span className="frow__k">Zone</span>
            {chips("zone", ["All"].concat(ZONES.map((z) => z.key)), (v) => (v === "All" ? "All" : ZONE_LABEL[v]))}
          </div>
          <div className="frow">
            <span className="frow__k">Stage</span>
            {chips("stage", STAGES, (v) => (v === "All" ? "Any" : v))}
          </div>
          <div className="frow">
            <span className="frow__k">Sort</span>
            <div className="chips" role="group" aria-label="Sort order">
              {(["fastest", "distance", "hiring"] as SortKey[]).map((k) => (
                <button key={k} type="button" className="chip" aria-pressed={s.sort === k} onClick={() => pickSort(k, "sorts")}>
                  {k === "fastest" ? "Fastest" : SORT_LABEL[k]}
                </button>
              ))}
            </div>
          </div>
          <details className="adv" id="adv">
            <summary>
              <span className="frow__k">More</span>
              <span className="adv__lbl">
                hiring, chart, distance, industry{advCount > 0 && <b>{advCount}</b>}
              </span>
              <i aria-hidden="true">+</i>
            </summary>
            <div className="frow">
              <span className="frow__k">Hiring</span>
              <div className="chips">
                <button type="button" className="chip" id="hiring" aria-pressed={s.hiring} onClick={toggleHiring}>
                  Hiring ops
                </button>
              </div>
            </div>
            <div className="frow">
              <span className="frow__k">Chart</span>
              {chips("chart", ["All", "Well Run 100", "Chase Pack"], (v) => v)}
            </div>
            <div className="frow">
              <span className="frow__k">Distance</span>
              {chips("dist", ["All"].concat(DISTS), (v) => v)}
            </div>
            <div className="frow">
              <span className="frow__k">Industry</span>
              {chips("industry", industries, (v) => v)}
            </div>
          </details>
          <p className="echo">
            <code>{cmd}</code>
          </p>
        </div>
      </div>

      <div className="cols">
        <span>Pos</span>
        <span>Company</span>
        {sortButtons("column", "cols__b")}
        <span />
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
                <button
                  type="button"
                  className="row__main"
                  aria-expanded={isOpen}
                  aria-controls={pid}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest(".logo") && r.site) {
                      cap("company_site_clicked", { company: r.name });
                      window.open(r.site, "_blank", "noopener");
                      return;
                    }
                    toggle(r);
                  }}
                >
                  <span className="row__pos">
                    <span className="sr-only">Position </span>
                    {p}
                    {r.ops > 0 && <span className="sr-only">, hiring ops</span>}
                  </span>
                  <span className="row__who">
                    <Logo name={r.name} host={r.host} />
                    <span className="row__txt">
                      <span className="row__name">{r.name}</span>
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
                  <span className="row__caret" aria-hidden="true" />
                </button>
              </div>
              <div className="sheet" id={pid} hidden={!isOpen}>
                {isOpen && (
                  <div className="sheet__in">
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
                    <p className="sheet__links">
                      <Link
                        href={`/${r.slug}`}
                        prefetch={false}
                        onClick={(e) => cap("company_link_clicked", { company: r.name, role: "", url: e.currentTarget.href })}
                      >
                        {r.name}&apos;s full page →
                      </Link>
                      {r.site && (
                        <a
                          href={r.site}
                          target="_blank"
                          rel="noopener"
                          aria-label={`${r.name} website`}
                          onClick={() => cap("company_link_clicked", { company: r.name, role: "", url: r.site })}
                        >
                          site ↗
                        </a>
                      )}
                    </p>
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
