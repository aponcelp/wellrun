import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/rank";
import { RISING_KINDS, getRising } from "@/lib/rising";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  const title = "Rising startups · The Next 25 and The Growing 25 · Well Run";
  const description = "Two hand-picked lists of startups to watch: The Next 25 (Seed to Series A) and The Growing 25 (Series B to D).";
  return { title, description, alternates: { canonical: `${SITE}/rising` }, openGraph: { type: "website", url: `${SITE}/rising`, siteName: "Well Run", title, description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rising startups" }] }, twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] } };
}

/** Index for the two lists; keeps old /rising links working. */
export default function RisingIndex() {
  const lists = RISING_KINDS.map((k) => ({ k, r: getRising(k) })).filter((x) => x.r);
  if (!lists.length) notFound();
  return (
    <div className="page page--rise">
      <nav className="back">
        <Link href="/">← Back to the board</Link>
        <span className="back__brand">Well Run</span>
      </nav>
      <header className="wkhead rise__head">
        <p className="wkhead__kicker">Well Run · {lists[0].r!.dateline}</p>
        <h1 className="wkhead__title">Rising startups</h1>
        <p className="rise__lede">Two hand-picked lists from the Well Run board: the early ones to watch, and the ones scaling fast.</p>
      </header>
      <div className="rise__pair">
        {lists.map(({ k, r }) => (
          <section key={k} className="rise__card">
            <h2 className="rise__h">
              <Link href={`/${k}`}>{r!.title}</Link>
            </h2>
            <p className="rise__what">{r!.lede}</p>
            <ol className="rise__top">
              {r!.picks.slice(0, 5).map((p) => (
                <li key={p.slug}>
                  <span className="rise__toprank">{p.rank}</span>
                  <Link href={`/${k}#${p.slug}`}>{p.name}</Link>
                  <small>{p.round.split(" · ")[0]}</small>
                </li>
              ))}
            </ol>
            <Link className="rise__more" href={`/${k}`}>
              See all 25 →
            </Link>
          </section>
        ))}
      </div>
    </div>
  );
}
