// The Rising 25: a hand-curated list of early-stage (Seed to Series B) startups to watch.
// Each edition is static JSON in data/rising/<YYYY-MM-DD>.json; the newest file is the live list.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type RisingPick = {
  rank: number;
  slug: string;
  name: string;
  round: string;
  lead: string;
  why: string;
  source: { label: string; url: string };
};
export type Rising = { date: string; title: string; dateline: string; lede: string; rules: string[]; method: string; picks: RisingPick[] };

const DIR = join(process.cwd(), "data", "rising");
let cache: Rising | null | undefined;

export function getRising(): Rising | null {
  if (cache !== undefined) return cache;
  cache = null;
  if (!existsSync(DIR)) return cache;
  const files = readdirSync(DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  const f = files[files.length - 1];
  if (!f) return cache;
  try {
    cache = JSON.parse(readFileSync(join(DIR, f), "utf8")) as Rising;
  } catch {
    cache = null;
  }
  return cache;
}

export function getRisingRank(slug: string): number | null {
  const r = getRising();
  return r?.picks.find((p) => p.slug === slug)?.rank ?? null;
}
