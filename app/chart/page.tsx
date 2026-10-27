import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ChartView from "@/components/ChartView";
import { getArticle, getChartIndex, getChartWeek } from "@/lib/chart";
import { SITE } from "@/lib/rank";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  const idx = getChartIndex();
  const w = idx.weeks[0];
  const title = "The Well Run 100 · Weekly chart";
  const description = w ? `${w.title}. The top 100 private startups by Pace, with last week, peak and weeks on chart.` : "The weekly Well Run 100 chart.";
  return { title, description, alternates: { canonical: `${SITE}/chart` }, openGraph: { type: "website", url: `${SITE}/chart`, siteName: "Well Run", title, description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "The Well Run 100" }] }, twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] } };
}

export default async function ChartLatest() {
  const idx = getChartIndex();
  const w = idx.latest ? getChartWeek(idx.latest) : null;
  if (!w) notFound();
  return <ChartView w={w} weeks={idx.weeks} article={getArticle(w.week)} />;
}
