"use client";
import { cap } from "@/lib/track";

export default function CoLinks({ name, site, careers }: { name: string; site: string; careers: string }) {
  return (
    <p className="co__links">
      {site && (
        <a href={site} target="_blank" rel="noopener" onClick={() => cap("company_site_clicked", { company: name })}>
          Website ↗
        </a>
      )}
      {careers && (
        <a href={careers} target="_blank" rel="noopener" onClick={() => cap("careers_clicked", { company: name, role: "", url: careers })}>
          Careers ↗
        </a>
      )}
    </p>
  );
}
