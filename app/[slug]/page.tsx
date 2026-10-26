import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Detail from "@/components/Detail";
import Logo from "@/components/Logo";
import { DistMark, ZoneMark } from "@/components/Marks";
import { getCard, getCompanies, getCompany } from "@/lib/data";
import { DMETA, SITE, fmtScore, has, hostOf, opsOf, zoneOf } from "@/lib/rank";
import CoLinks from "./CoLinks";
import CoTrack from "@/components/CoTrack";
import RivalTrack from "@/components/RivalTrack";
import Shot from "@/components/Shot";
import CoRun from "@/components/CoRun";
import KeepGoing from "@/components/KeepGoing";
import { getChartRun } from "@/lib/chart";
import { FundingHistory, Glance, Leadership, NewsTimeline } from "@/components/Profile";

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
  const hit = await getCard(slug);
  if (!hit) notFound();
  const { card: c, rank } = hit;
  const e = c.enrich || null;
  const z = zoneOf(c);
  const host = hostOf(c.site);
  const ops = opsOf(c).length;
  const lead = rank === 1;
  const run = getChartRun(c.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: c.name,
    url: c.site || undefined,
    description: c.what_they_do || undefined,
    foundingDate: e?.founded ? String(e.founded) : undefined,
    founder: e?.leadership?.filter((p) => p.founder).map((p) => ({ "@type": "Person", name: p.name, jobTitle: p.title })),
    location: e?.hq || undefined,
    sameAs: c.site ? [c.site] : undefined,
  };
  return (
    <div className="page page--co">
      <nav className="back">
        <Link href="/">← Back to the board</Link>
        <span className="back__brand">Well Run</span>
      </nav>
      <header className={"co" + (lead ? " co--lead" : "") + (c.og ? " co--shot" : "")}>
        {c.og && <Shot og={c.og} name={c.name} className="co__shot" eager />}
        <p className="co__chart">
          <span className="co__badge">Well Run profile</span>
          {rank <= 100 ? "The Well Run 100" : "The Chase Pack"} · #{rank} of {(await getCompanies()).length}
        </p>
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
        {run && <CoRun run={run} />}
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
        <CoLinks name={c.name} slug={c.slug} site={c.site} careers={has(c.careers_url) ? c.careers_url : ""} />
        {c.rivals && c.rivals.track.length > 1 ? (
          <RivalTrack track={c.rivals.track} off={c.rivals.off} hi={c.rivals.hi} />
        ) : (
          <>
            <CoTrack all={await getCompanies()} c={c} />
            {c.rivals && c.rivals.off.length > 0 && <p className="rtrack__off rtrack__off--solo">Also competes with: {c.rivals.off.join(", ")}</p>}
          </>
        )}
      </header>
      {e && <Glance e={e} name={c.name} />}
      {e && <Leadership e={e} name={c.name} />}
      <article className="sheet sheet--page">
        <div className="sheet__in">
          <Detail c={c} variant="page" />
        </div>
      </article>
      {e && (e.funding_history?.length || e.news_timeline?.length) ? (
        <div className="pf-two">
          <NewsTimeline e={e} name={c.name} />
          <FundingHistory e={e} name={c.name} />
        </div>
      ) : null}
      {e?.checked && <p className="d-checked pf-checked">Profile facts checked {e.checked}. Every fact links to its public source.</p>}
      <KeepGoing all={await getCompanies()} c={c} />
      <p className="back back--end">
        <Link href="/">← Back to the board</Link>
      </p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
