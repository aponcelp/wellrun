import type { MetadataRoute } from "next";
import { getCompanies } from "@/lib/data";
import { SITE } from "@/lib/rank";
import { getChartIndex } from "@/lib/chart";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const list = await getCompanies();
  return [
    { url: SITE + "/", lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: SITE + "/chart", lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...getChartIndex().weeks.map((w) => ({ url: `${SITE}/chart/${w.week}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...list.map((c) => ({ url: `${SITE}/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
