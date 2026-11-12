import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RisingList from "@/components/RisingList";
import { SITE } from "@/lib/rank";
import { getRising } from "@/lib/rising";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  const r = getRising("growing");
  const title = "The Growing 25 · Well Run";
  const description = r ? r.lede : "Twenty-five startups to watch.";
  const url = `${SITE}/growing`;
  return { title, description, alternates: { canonical: url }, openGraph: { type: "website", url, siteName: "Well Run", title, description, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "The Growing 25" }] }, twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] } };
}

export default async function GrowingPage() {
  const r = getRising("growing");
  if (!r) notFound();
  return <RisingList r={r} />;
}
