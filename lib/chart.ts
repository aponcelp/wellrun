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
export type Spotlight = { label: string; slug: string; name: string; tagline: string; facts: { k: string; v: string }[]; why: string; sources: { label: string; url: string }[] };
export type Article = { week: string; title: string; lede: string; sections: { heading: string; body?: string; items: ArticleItem[] }[]; spotlight?: Spotlight; outro?: string };

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

/** One company's run on the weekly chart: this week, last week, peak, weeks in the top 100. */
export type ChartRun = { week: WeekLabel; rank: number; lw: number | null; peak: number; wks: number; total: number };
export function getChartRun(slug: string): ChartRun | null {
  const idx = getChartIndex();
  const weeks = idx.weeks.map((w) => getChartWeek(w.week)).filter((w): w is ChartWeek => !!w);
  if (!weeks.length) return null;
  const rankIn = (w: ChartWeek) => (w.chart.find((e) => e.slug === slug) || w.chase.find((e) => e.slug === slug))?.rank ?? null;
  const cur = weeks[0];
  const rank = rankIn(cur);
  if (rank == null) return null;
  const lw = weeks[1] ? rankIn(weeks[1]) : null;
  const ranks = weeks.map(rankIn).filter((r): r is number => r != null);
  const wks = weeks.filter((w) => w.chart.some((e) => e.slug === slug)).length;
  const { week, title, tracking, short } = cur;
  return { week: { week, title, tracking, short }, rank, lw, peak: Math.min(...ranks), wks, total: cur.total || cur.chart.length + cur.chase.length };
}

/** One company's weekly history (oldest first): rank and score each Sunday it was on the board. */
export type HistPoint = { week: string; short: string; rank: number; score: number; inTop: boolean };
export function getHistory(slug: string): HistPoint[] {
  const idx = getChartIndex();
  const out: HistPoint[] = [];
  for (const wl of [...idx.weeks].reverse()) {
    const w = getChartWeek(wl.week);
    if (!w) continue;
    const top = w.chart.find((e) => e.slug === slug);
    const e = top || w.chase.find((x) => x.slug === slug);
    if (e) out.push({ week: wl.week, short: wl.short.replace(/, \d{4}$/, ""), rank: e.rank, score: Number(e.score) || 0, inTop: !!top });
  }
  return out;
}
