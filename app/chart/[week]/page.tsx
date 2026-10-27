import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ChartView from "@/components/ChartView";
import { getArticle, getChartIndex, getChartWeek } from "@/lib/chart";
import { SITE } from "@/lib/rank";

export const dynamicParams = false;

export function generateStaticParams() {
  return getChartIndex().weeks.map((w) => ({ week: w.week }));
}

type Props = { params: Promise<{ week: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { week } = await params;
  const w = getChartWeek(week);
  if (!w) return {};
  const title = `The Well Run 100 · ${w.title}`;
  const description = `${w.tracking}. The top 100 private startups by Pace, with last week, peak and weeks on chart.`;
  const url = `${SITE}/chart/${week}`;
  return { title, description, alternates: { canonical: url }, openGraph: { type: "website", url, siteName: "Well Run", title, description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "The Well Run 100" }] }, twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] } };
}

export default async function ChartWeekPage({ params }: Props) {
  const { week } = await params;
  const w = getChartWeek(week);
  if (!w) notFound();
  return <ChartView w={w} weeks={getChartIndex().weeks} article={getArticle(week)} />;
}
