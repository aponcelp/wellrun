import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Logo from "@/components/Logo";
import { getCompanies } from "@/lib/data";
import { SITE, has, hostOf } from "@/lib/rank";
import { getRising } from "@/lib/rising";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  const r = getRising();
  const title = "The Rising 25 · Well Run";
  const description = r ? r.lede : "Twenty-five early-stage startups to watch.";
  return { title, description, alternates: { canonical: `${SITE}/rising` }, openGraph: { type: "website", url: `${SITE}/rising`, siteName: "Well Run", title, description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "The Rising 25" }] }, twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] } };
}

export default async function RisingPage() {
  const r = getRising();
  if (!r) notFound();
  const all = await getCompanies();
  const bySlug = new Map(all.map((c) => [c.slug, c]));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "The Rising 25",
    itemListElement: r.picks.map((p) => ({ "@type": "ListItem", position: p.rank, name: p.name, url: `${SITE}/${p.slug}` })),
  };
  return (
    <div className="page page--rise">
      <nav className="back">
        <Link href="/">← Back to the board</Link>
        <span className="back__brand">Well Run</span>
      </nav>
      <header className="wkhead rise__head">
        <p className="wkhead__kicker">Well Run · {r.dateline}</p>
        <h1 className="wkhead__title">{r.title}</h1>
        <p className="rise__lede">{r.lede}</p>
        <ul className="rise__rules" aria-label="Who makes the list">
          {r.rules.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </header>
      <div className="rise__cols" aria-hidden="true">
        <span>#</span>
        <span>Company</span>
        <span>Last round</span>
        <span>Why it&apos;s rising</span>
      </div>
      <ol className="rise__list">
        {r.picks.map((p) => {
          const c = bySlug.get(p.slug);
          return (
            <li key={p.slug} id={p.slug} className={"rise__row" + (p.rank === 1 ? " rise__row--lead" : "")}>
              <span className="rise__rank">{p.rank}</span>
              <div className="rise__who">
                <Link className="rise__name" href={`/${p.slug}`}>
                  <Logo name={p.name} host={c ? hostOf(c.site) : ""} className="rise__logo" />
                  {p.name}
                </Link>
                {c && has(c.what_they_do) && <p className="rise__what">{c.what_they_do}</p>}
              </div>
              <p className="rise__round">
                <b>{p.round}</b>
                <span>{p.lead}</span>
              </p>
              <div className="rise__why">
                <p>{p.why}</p>
                <a className="rise__src" href={p.source.url} target="_blank" rel="noopener noreferrer">
                  {p.source.label} ↗
                </a>
              </div>
            </li>
          );
        })}
      </ol>
      <section className="rise__how" id="how-we-pick">
        <h2 className="rise__h">How we pick the list</h2>
        <p>{r.method}</p>
      </section>
      <p className="back back--end">
        <Link href="/">← Back to the board</Link>
      </p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
