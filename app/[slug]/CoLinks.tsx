"use client";
import { cap } from "@/lib/track";
import { hostOf } from "@/lib/rank";
import CopyLink from "@/components/CopyLink";

export default function CoLinks({ name, slug, site, careers }: { name: string; slug: string; site: string; careers: string }) {
  return (
    <p className="co__links">
      {site && (
        <a href={site} target="_blank" rel="noopener" onClick={() => cap("company_site_clicked", { company: name })}>
          {hostOf(site) || "Website"} ↗
        </a>
      )}
      {careers && (
        <a href={careers} target="_blank" rel="noopener" onClick={() => cap("careers_clicked", { company: name, role: "", url: careers })}>
          Careers ↗
        </a>
      )}
      <CopyLink slug={slug} name={name} />
    </p>
  );
}
