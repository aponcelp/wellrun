import Link from "next/link";
import Logo from "@/components/Logo";
import { ZoneMark } from "@/components/Marks";
import type { Company } from "@/lib/types";
import { bucketOf, fmtScore, hostOf, zoneOf } from "@/lib/rank";

type Item = { c: Company; rank: number };

function Mini({ c, rank }: Item) {
  return (
    <li>
      <Link href={`/${c.slug}`} className="kg__item">
        <span className="kg__rank">{rank}</span>
        <Logo name={c.name} host={hostOf(c.site)} className="kg__logo" />
        <span className="kg__name">
          <b>{c.name}</b>
          {c.what_they_do && <span>{c.what_they_do}</span>}
        </span>
        <ZoneMark zone={zoneOf(c).key} score={fmtScore(Number(c.score) || 0)} />
      </Link>
    </li>
  );
}

/** Bottom-of-page paths onward: neighbours on the board, the same sector, and the weekly chart. */
export default function KeepGoing({ all, c }: { all: Company[]; c: Company }) {
  const i = all.findIndex((x) => x.slug === c.slug);
  const near: Item[] = [i - 2, i - 1, i + 1, i + 2].filter((j) => j >= 0 && j < all.length).map((j) => ({ c: all[j], rank: j + 1 }));
  const b = bucketOf(c);
  const same: Item[] =
    b === "Other"
      ? []
      : all
          .map((x, j) => ({ c: x, rank: j + 1 }))
          .filter((x) => x.c.slug !== c.slug && bucketOf(x.c) === b && !near.some((n) => n.c.slug === x.c.slug))
          .slice(0, 4);
  return (
    <section className="kg" aria-label="Keep exploring Well Run">
      <h2 className="kg__h">Keep going</h2>
      <div className="kg__cols">
        <div>
          <p className="kg__k">Around #{i + 1} on the board</p>
          <ul className="kg__list">{near.map((x) => <Mini key={x.c.slug} {...x} />)}</ul>
        </div>
        {same.length > 0 && (
          <div>
            <p className="kg__k">Top of {b}</p>
            <ul className="kg__list">{same.map((x) => <Mini key={x.c.slug} {...x} />)}</ul>
          </div>
        )}
      </div>
      <nav className="kg__go">
        <Link className="navchart__b navchart__b--week" href="/chart?tab=week">This week&apos;s moves</Link>
        <Link className="navchart__b" href="/chart?tab=chart">The Chart</Link>
        <Link className="navchart__b" href="/">The full board</Link>
      </nav>
    </section>
  );
}
