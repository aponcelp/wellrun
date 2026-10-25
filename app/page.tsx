import Board from "@/components/Board";
import { Hero } from "@/components/Intro";
import Track, { type Runner } from "@/components/Track";
import { getCompanies, getCompaniesInDataOrder } from "@/lib/data";
import { hostOf, toRows, zoneOf } from "@/lib/rank";
import { getLatestBB } from "@/lib/chart";
import Link from "next/link";

export default async function Home() {
  const rows = toRows(await getCompanies());
  const bb = getLatestBB();
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
          <Link className="navchart" href="/chart">The Chart</Link>
          <span className="by">
            by <a href="https://www.linkedin.com/in/alfredoponcedeleon" target="_blank" rel="noopener">Alfredo Ponce de León</a>
          </span>
        </div>
        <Hero track={<Track pool={pool} />} />
      </header>
      <main>
        <Board rows={rows} bb={bb.bySlug} bbWeek={bb.week ? bb.week.title : ""} />
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
