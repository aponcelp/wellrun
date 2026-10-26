import Link from "next/link";
import ChartMove from "./ChartMove";
import { ChartTabs, WeekPicker } from "./ChartTabs";
import { ZoneMark } from "./Marks";
import { fmtScore } from "@/lib/rank";
import { getCompanies } from "@/lib/data";
import type { Article, ChartWeek, WeekLabel } from "@/lib/chart";

function Name({ slug, name, live }: { slug: string; name: string; live: Set<string> }) {
  return live.has(slug) ? (
    <Link className="wk__name" href={`/${slug}`}>
      {name}
    </Link>
  ) : (
    <span className="wk__name">{name}</span>
  );
}

function ArticleView({ a, live }: { a: Article | null; live: Set<string> }) {
  if (!a) return <p className="wkart__lede">No write-up for this week yet.</p>;
  return (
    <article className="wkart">
      <h2 className="wkart__title">{a.title}</h2>
      <p className="wkart__lede">{a.lede}</p>
      {a.sections.map((s) => (
        <section key={s.heading} className="wkart__sec">
          <h3 className="wkart__h">{s.heading}</h3>
          {s.body && <p className="wkart__p">{s.body}</p>}
          <ul className={"wkart__items" + (s.items.some((it) => it.why) ? "" : " wkart__items--tight")}>
            {s.items.map((it) => (
              <li key={it.slug} className="wkart__item">
                <p className="wkart__who">
                  <Name slug={it.slug} name={it.name} live={live} />
                  {it.move && <span className="wkart__move">{it.move}</span>}
                </p>
                {(it.score || it.zone) && (
                  <p className="wkart__facts">
                    {it.score && <span>Score {it.score}</span>}
                    {it.zone && <span>{it.zone}</span>}
                  </p>
                )}
                {it.why && <p className="wkart__p">{it.why}</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {a.spotlight && (
        <section className="spot" aria-label={a.spotlight.label}>
          <p className="spot__k">{a.spotlight.label}</p>
          <h3 className="spot__name">
            <Name slug={a.spotlight.slug} name={a.spotlight.name} live={live} />
          </h3>
          <p className="spot__tag">{a.spotlight.tagline}</p>
          <dl className="spot__facts">
            {a.spotlight.facts.map((f) => (
              <div key={f.k}>
                <dt>{f.k}</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>
          <div className="spot__why">
            <p className="spot__wk">Why I like it</p>
            <p>{a.spotlight.why}</p>
          </div>
          <p className="spot__src">
            Sources:{" "}
            {a.spotlight.sources.map((x, i) => (
              <span key={x.url}>
                {i > 0 && " · "}
                <a href={x.url} target="_blank" rel="noopener noreferrer">{x.label} ↗</a>
              </span>
            ))}
          </p>
        </section>
      )}
      {a.outro && <p className="wkart__outro">{a.outro}</p>}
    </article>
  );
}

export default async function ChartView({ w, weeks, article }: { w: ChartWeek; weeks: WeekLabel[]; article: Article | null }) {
  const live = new Set((await getCompanies()).map((c) => c.slug));
  const chart = (
    <>
      <div className="wk__cols" aria-hidden="true">
        <span>This week</span>
        <span />
        <span>Company</span>
        <span>Last week</span>
        <span>Peak</span>
        <span>Wks on chart</span>
      </div>
      <ol className="wk__list">
        {w.chart.map((e) => (
          <li key={e.slug} className="wk__row">
            <span className="wk__rank">{e.rank}</span>
            <span className="wk__mv">
              <ChartMove rank={e.rank} lw={e.last_week} isNew={e.new} />
            </span>
            <span className="wk__who">
              <Name slug={e.slug} name={e.name} live={live} />
              <span className="wk__sub">
                <ZoneMark zone={e.zone} score={fmtScore(e.score)} />
                <span className="wk__fold">
                  <span className="st"><i>LW</i><b>{e.last_week ?? "–"}</b></span>
                  <span className="st"><i>Peak</i><b>{e.peak}</b></span>
                  <span className="st"><i>Wks</i><b>{e.weeks}</b></span>
                </span>
              </span>
            </span>
            <span className="wk__n wk__lw"><span className="sr-only">Last week </span>{e.last_week ?? "–"}</span>
            <span className="wk__n"><span className="sr-only">Peak </span>{e.peak}</span>
            <span className="wk__n"><span className="sr-only">Weeks on chart </span>{e.weeks}</span>
          </li>
        ))}
      </ol>
      <h2 className="wk__chase">The Chase Pack</h2>
      <p className="wk__chasesub">ranks 101 to {w.total}, chasing the top 100</p>
      <ol className="wk__list wk__list--chase">
        {w.chase.map((e) => (
          <li key={e.slug} className="wk__row wk__row--chase">
            <span className="wk__rank">{e.rank}</span>
            <span className="wk__who">
              <Name slug={e.slug} name={e.name} live={live} />
            </span>
            <span className="wk__zone">
              <ZoneMark zone={e.zone} score={fmtScore(e.score)} />
            </span>
          </li>
        ))}
      </ol>
    </>
  );
  const art = w.baseline && !article ? <p className="wkart__lede">First week of the chart. Movement starts next week.</p> : <ArticleView a={article} live={live} />;
  return (
    <div className="page page--wk">
      <nav className="back">
        <Link href="/">← Back to the board</Link>
        <span className="back__brand">Well Run</span>
      </nav>
      <header className="wkhead">
        <p className="wkhead__kicker">The Well Run 100</p>
        <h1 className="wkhead__title">{w.title}</h1>
        <p className="wkhead__track">{w.tracking}</p>
        <WeekPicker week={w.week} weeks={weeks} />
      </header>
      <ChartTabs week={w.week} chart={chart} article={art} />
    </div>
  );
}
