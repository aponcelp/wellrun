import Board from "@/components/Board";
import { Scoring, Story } from "@/components/Intro";
import Track, { type Runner } from "@/components/Track";
import { getCompanies, getCompaniesInDataOrder } from "@/lib/data";
import { hostOf, toRows, zoneOf } from "@/lib/rank";

export default async function Home() {
  const rows = toRows(await getCompanies());
  // Track runners, pooled exactly like the original drawTrack(): every company in its zone,
  // in dataset order, then a stable sort by score (fastest first). The track rotates through all of them.
  const pool: Record<string, Runner[]> = {};
  (await getCompaniesInDataOrder()).forEach((c) => {
    const k = zoneOf(c).key;
    (pool[k] = pool[k] || []).push({ name: c.name, host: hostOf(c.site), score: Number(c.score) || 0 });
  });
  Object.values(pool).forEach((a) => a.sort((x, y) => y.score - x.score));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "The Well Run 100",
    itemListElement: rows.slice(0, 100).map((r) => ({ "@type": "ListItem", position: r.rank, name: r.name, url: `https://www.wellrun.so/${r.slug}` })),
  };
  return (
    <div className="page" id="top">
      <header className="top">
        <div className="brandbar">
          <p className="brand">
            <span className="brand__ball" aria-hidden="true" />
            <span className="brand__word">Well Run</span>
            <small>daily</small>
          </p>
          <span className="by">
            by <a href="https://www.linkedin.com/in/alfredoponcedeleon" target="_blank" rel="noopener">Alfredo Ponce de León</a>
          </span>
        </div>
        <div className="hero">
          <div className="hero__copy">
            <h1 className="tagline">
              Startups that run well. <span>Private companies only, paced by funding and buzz, curated daily.</span>
            </h1>
            <div className="intro">
              <Story />
              <Scoring />
            </div>
          </div>
          <Track pool={pool} />
        </div>
      </header>
      <main>
        <Board rows={rows} />
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
