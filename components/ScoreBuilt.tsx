"use client";
import { useId, useState } from "react";
import type { Company } from "@/lib/types";
import { buildScore, signed } from "@/lib/score";
import { DMETA, ZONE_BY_KEY, fmtScore, has, zoneOf } from "@/lib/rank";
import { cap } from "@/lib/track";

/** Collapsible "How this score was built": each Pace input with its points and why, adding up to the stored score. */
export default function ScoreBuilt({ c }: { c: Company }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const b = buildScore(c);
  const z = ZONE_BY_KEY[zoneOf(c).key];
  const flagSrc = (c.red_flags_sources || []).filter((s) => s && s.url);
  const n = (x: number) => fmtScore(Math.abs(x)).replace(/\.0$/, "");
  const sum = b.lines
    .filter((l) => l.pts != null)
    .map((l, i) => (i === 0 ? n(l.pts as number) : (l.pts as number) < 0 || l.key === "flags" ? `− ${n(l.pts as number)}` : `+ ${n(l.pts as number)}`))
    .join(" ");
  return (
    <div className={"sb" + (open ? " is-open" : "")}>
      <button
        type="button"
        className="sb__t"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          cap("score_breakdown_toggled", { company: c.name, open: !open });
          setOpen((o) => !o);
        }}
      >
        <span className="sb__mark" aria-hidden="true">{open ? "−" : "+"}</span>
        <span className="sb__lbl">How this score was built</span>
        <span className={`sb__sum z-${z.key}`}>
          {fmtScore(b.score)} <i>{z.name}</i>
        </span>
      </button>
      <div className="sb__body" id={id} hidden={!open}>
        <ol className="sb__lines">
          {b.lines.map((l) => (
            <li key={l.key} className={"sb__line sb__line--" + l.key + (l.pts == null ? " is-na" : l.pts < 0 ? " is-neg" : l.pts === 0 ? " is-zero" : "")}>
              <span className="sb__k">{l.label}</span>
              <span className="sb__pts">{l.pts == null ? "—" : signed(l.pts)}</span>
              <span className="sb__why">
                {l.why}
                {l.key === "flags" && has(c.red_flags) && (l.pts == null || l.pts < 0) && (
                  <span className="sb__flags">
                    {c.red_flags}
                    {flagSrc.length > 0 && (
                      <span className="sb__src">
                        {flagSrc.map((s, i) => (
                          <span key={i}>
                            {i > 0 && " · "}
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener"
                              onClick={() => cap("company_link_clicked", { company: c.name, role: "", url: s.url })}
                            >
                              {(s.label || "Source") + " ↗"}
                            </a>
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                )}
              </span>
            </li>
          ))}
          <li className="sb__line sb__line--total">
            <span className="sb__k">Total</span>
            <span className="sb__pts">{fmtScore(b.score)}</span>
            <span className="sb__why">
              {b.status === "exact" ? (
                <>
                  {sum} = {fmtScore(b.score)} → <b>{b.zone}</b>
                  {b.zoneWhy && <> ({b.zoneWhy})</>}
                </>
              ) : b.status === "floor" ? (
                <>
                  floored at 0 → <b>{b.zone}</b>
                </>
              ) : (
                <>
                  Stored score → <b>{b.zone}</b>
                  {b.zoneWhy && <> ({b.zoneWhy})</>}
                </>
              )}
            </span>
          </li>
        </ol>
        {b.override && <p className="sb__note sb__note--rule">{b.override}</p>}
        {b.note && <p className="sb__note">{b.note}</p>}
        <p className="sb__note">
          Distance{DMETA[String(c.distance || "").trim()] ? ` (${String(c.distance).trim()})` : ""} is a separate read on how long the lead can last. It doesn&apos;t change the score.
        </p>
      </div>
    </div>
  );
}
