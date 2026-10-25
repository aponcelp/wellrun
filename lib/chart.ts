// The weekly Well Run 100 chart: static JSON exported from Supabase weekly_snapshots
// (data/charts/<week>.json, data/charts/index.json, articles in data/charts/articles/).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ZoneKey } from "./types";

export type ChartEntry = {
  rank: number;
  slug: string;
  name: string;
  zone: ZoneKey;
  score: number;
  open_roles: number | null;
  last_week: number | null;
  peak: number;
  weeks: number;
  new: boolean;
};
export type ChaseEntry = { rank: number; slug: string; name: string; zone: ZoneKey; score: number; open_roles: number | null };
export type WeekLabel = { week: string; title: string; tracking: string; short: string };
export type ChartWeek = WeekLabel & { baseline: boolean; total: number; chart: ChartEntry[]; chase: ChaseEntry[] };
export type ArticleItem = { slug: string; name: string; move?: string; score?: string; zone?: string; why?: string };
export type Article = { week: string; title: string; lede: string; sections: { heading: string; body?: string; items: ArticleItem[] }[]; outro?: string };

const DIR = join(process.cwd(), "data", "charts");
const read = <T,>(f: string): T | null => {
  const p = join(DIR, f);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
};

export function getChartIndex(): { latest: string; weeks: WeekLabel[] } {
  return read<{ latest: string; weeks: WeekLabel[] }>("index.json") || { latest: "", weeks: [] };
}
export function getChartWeek(week: string): ChartWeek | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(week) ? read<ChartWeek>(`${week}.json`) : null;
}
export function getArticle(week: string): Article | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(week) ? read<Article>(join("articles", `${week}.json`)) : null;
}

/** Billboard metadata for the homepage board: latest week's top 100, keyed by slug. */
export type BB = { rank: number; lw: number | null; peak: number; wks: number; isNew: boolean };
export function getLatestBB(): { week: WeekLabel | null; bySlug: Record<string, BB> } {
  const idx = getChartIndex();
  const w = idx.latest ? getChartWeek(idx.latest) : null;
  if (!w) return { week: null, bySlug: {} };
  const bySlug: Record<string, BB> = {};
  for (const e of w.chart) bySlug[e.slug] = { rank: e.rank, lw: e.last_week, peak: e.peak, wks: e.weeks, isNew: e.new };
  const { week, title, tracking, short } = w;
  return { week: { week, title, tracking, short }, bySlug };
}
