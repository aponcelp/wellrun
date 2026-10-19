import type { Company } from "@/lib/types";
import { ZONES, hostOf, zoneOf } from "@/lib/rank";

/** Where a runner sits along its lane: its score against the fastest score on the board (left = slower). */
function spot(all: Company[], c: Company) {
  const hi = Math.max(...all.map((x) => Number(x.score) || 0)) || 1;
  return 0.06 + 0.86 * Math.max(0, Math.min(1, (Number(c.score) || 0) / hi));
}

/**
 * The race track for a company page: a flat strip with one lane per pace zone, like the share image.
 * Each lane shows its leader; this company is the lime marker, labeled, in its own lane.
 */
export default function CoTrack({ all, c }: { all: Company[]; c: Company }) {
  const z = zoneOf(c);
  const inZone = all.filter((x) => zoneOf(x).key === z.key); // already in Pace order
  const place = inZone.findIndex((x) => x.slug === c.slug) + 1;
  const at = spot(all, c);
  const right = at > 0.62;
  return (
    <figure className="cotrack" aria-label={`Pace track: ${c.name} runs in the ${z.name} lane, ${place} of ${inZone.length} in that zone`}>
      <div className="cotrack__oval" aria-hidden="true">
        <span className="cotrack__flag" />
        {ZONES.map((lz) => {
          const lead = all.find((x) => zoneOf(x).key === lz.key);
          const mine = lz.key === z.key;
          const host = lead ? hostOf(lead.site) : "";
          return (
            <div key={lz.key} className={`cotrack__lane z-${lz.key}` + (mine ? " is-mine" : "")}>
              <span className="cotrack__lbl">
                {lz.name} <small>{lz.split}/km</small>
              </span>
              <span className="cotrack__run">
                {lead && !mine && (
                  <span className="cotrack__dot" style={{ left: `${(spot(all, lead) * 100).toFixed(1)}%` }} title={`${lead.name}, ${lz.name} leader`}>
                    {lead.name.charAt(0)}
                    {host && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`} alt="" loading="lazy" />
                    )}
                  </span>
                )}
                {mine && (
                  <span className={"cotrack__me" + (right ? " is-right" : "")} style={{ left: `${(at * 100).toFixed(1)}%` }}>
                    <i>{c.name.charAt(0)}</i>
                    <b>{c.name}</b>
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <figcaption>
        <b>{c.name}</b> runs in the {z.name} lane ({z.split}/km): {place === 1 ? "leading it" : `${place} of ${inZone.length}`}. Other dots are each lane&apos;s leader; further right = more momentum.
      </figcaption>
    </figure>
  );
}
