// Two hand-curated lists of startups to watch:
//   The Next 25 (/next)       Seed to Series A
//   The Growing 25 (/growing) Series B to D
// Each edition is static JSON in data/rising/<kind>-<YYYY-MM-DD>.json; the newest file per kind is the live list.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type RisingKind = "next" | "growing";
export const RISING_KINDS: RisingKind[] = ["next", "growing"];

export type RisingPick = {
  rank: number;
  slug: string;
  name: string;
  round: string;
  lead: string;
  why: string;
  source: { label: string; url: string };
};
export type Rising = {
  date: string;
  kind: RisingKind;
  title: string;
  dateline: string;
  lede: string;
  rules: string[];
  method: string;
  sibling: { href: string; title: string; blurb: string };
  picks: RisingPick[];
};

const DIR = join(process.cwd(), "data", "rising");
const cache = new Map<RisingKind, Rising | null>();

export function getRising(kind: RisingKind): Rising | null {
  if (cache.has(kind)) return cache.get(kind) ?? null;
  let out: Rising | null = null;
  if (existsSync(DIR)) {
    const re = new RegExp(`^${kind}-\\d{4}-\\d{2}-\\d{2}\\.json$`);
    const f = readdirSync(DIR).filter((x) => re.test(x)).sort().pop();
    if (f) {
      try {
        out = JSON.parse(readFileSync(join(DIR, f), "utf8")) as Rising;
      } catch {
        out = null;
      }
    }
  }
  cache.set(kind, out);
  return out;
}

/** Which list (if any) a company is on, with its rank and the page to link to. */
export function getRisingSpot(slug: string): { rank: number; title: string; href: string } | null {
  for (const kind of RISING_KINDS) {
    const r = getRising(kind);
    const p = r?.picks.find((x) => x.slug === slug);
    if (r && p) return { rank: p.rank, title: r.title, href: `/${kind}#${slug}` };
  }
  return null;
}
