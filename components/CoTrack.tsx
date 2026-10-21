import type { Company } from "@/lib/types";
import { ZONES, zoneOf } from "@/lib/rank";

/** Where a runner sits along its lane: its score against the fastest score on the board (left = slower). */
function spot(all: Company[], c: Company) {
  const hi = Math.max(...all.map((x) => Number(x.score) || 0)) || 1;
  return 0.06 + 0.86 * Math.max(0, Math.min(1, (Number(c.score) || 0) / hi));
}

/**
 * The race track for a company page: a flat strip with one lane per pace zone, like the share image.
 * Only this company is drawn (lime marker in its own lane): non-competitors never appear on its track.
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
          const mine = lz.key === z.key;
          return (
            <div key={lz.key} className={`cotrack__lane z-${lz.key}` + (mine ? " is-mine" : "")}>
              <span className="cotrack__lbl">
                {lz.name} <small>{lz.split}/km</small>
              </span>
              <span className="cotrack__run">
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
        <b>{c.name}</b> runs in the {z.name} lane ({z.split}/km): {place === 1 ? "leading it" : `${place} of ${inZone.length}`}. Further right = more momentum. No competitors on the board yet, so it runs alone.
      </figcaption>
    </figure>
  );
}
