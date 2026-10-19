import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Detail from "@/components/Detail";
import Logo from "@/components/Logo";
import { DistMark, ZoneMark } from "@/components/Marks";
import { getCompanies, getCompany } from "@/lib/data";
import { DMETA, SITE, fmtScore, has, hostOf, opsOf, zoneOf } from "@/lib/rank";
import CoLinks from "./CoLinks";
import CoTrack from "@/components/CoTrack";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getCompanies()).map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hit = await getCompany(slug);
  if (!hit) return {};
  const { company: c, rank } = hit;
  const z = zoneOf(c);
  const chart = rank <= 100 ? "the Well Run 100" : "the Chase Pack";
  const title = `${c.name} · #${rank} on Well Run`;
  const what = has(c.what_they_do) ? c.what_they_do.replace(/\.$/, "") + ". " : "";
  const dist = DMETA[c.distance] ? `, ${c.distance} distance` : "";
  const ops = opsOf(c).length;
  const description = `${what}#${rank} in ${chart}: ${z.name} pace (${fmtScore(Number(c.score) || 0)})${dist}${ops ? `, ${ops} open ops ${ops === 1 ? "role" : "roles"}` : ""}.`;
  const url = `${SITE}/${c.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    // og:image comes from ./opengraph-image.tsx (file-based metadata); twitter:image points at the same PNG.
    openGraph: { type: "website", url, siteName: "Well Run", title, description },
    twitter: { card: "summary_large_image", title, description, images: [{ url: `/${c.slug}/opengraph-image`, width: 1200, height: 630, alt: title }] },
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const hit = await getCompany(slug);
  if (!hit) notFound();
  const { company: c, rank } = hit;
  const z = zoneOf(c);
  const host = hostOf(c.site);
  const ops = opsOf(c).length;
  const lead = rank === 1;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: c.name,
    url: c.site || undefined,
    description: c.what_they_do || undefined,
  };
  return (
    <div className="page page--co">
      <nav className="back">
        <Link href="/">← Back to the board</Link>
        <span className="back__brand">Well Run</span>
      </nav>
      <header className={"co" + (lead ? " co--lead" : "")}>
        <p className="co__chart">{rank <= 100 ? "The Well Run 100" : "The Chase Pack"}</p>
        <div className="co__head">
          <span className="co__rank">
            <span className="sr-only">Position </span>
            {rank}
          </span>
          <div>
            <h1 className="co__name">
              <Logo name={c.name} host={host} className="co__logo" />
              {c.name}
            </h1>
            {has(c.what_they_do) && <p className="co__what">{c.what_they_do}</p>}
          </div>
        </div>
        <dl className="co__stats">
          <div>
            <dt>Pace</dt>
            <dd>
              <ZoneMark zone={z.key} score={fmtScore(Number(c.score) || 0)} split meter />
            </dd>
          </div>
          <div>
            <dt>Distance</dt>
            <dd>
              <DistMark distance={String(c.distance || "").trim()} />
            </dd>
          </div>
          <div>
            <dt>Open ops roles</dt>
            <dd className="co__ops">{ops || "—"}</dd>
          </div>
        </dl>
        <CoTrack all={await getCompanies()} c={c} />
        <CoLinks name={c.name} slug={c.slug} site={c.site} careers={has(c.careers_url) ? c.careers_url : ""} />
      </header>
      <article className="sheet sheet--page">
        <div className="sheet__in">
          <Detail c={c} />
        </div>
      </article>
      <p className="back back--end">
        <Link href="/">← Back to the board</Link>
      </p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
