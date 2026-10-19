"use client";
import Link from "next/link";
import type { Runner } from "@/lib/types";
import { ZONES, ZONE_BY_KEY } from "@/lib/rank";
import { cap } from "@/lib/track";

/** Where a runner sits along its lane: its score against the fastest score on the board (left = slower). */
const spot = (score: number, hi: number) => 0.04 + 0.92 * Math.max(0, Math.min(1, score / (hi || 1)));

/**
 * The race track with this company highlighted in its own lane and its rivals on Well Run in theirs.
 * A rival in the same lane runs right before (slower) or right after (faster) the company.
 * Lanes with no rival stay empty. Tapping a rival opens its Well Run page.
 */
export default function RivalTrack({ track, off, hi, compact }: { track: Runner[]; off: string[]; hi: number; compact?: boolean }) {
  const me = track.find((r) => r.me) || track[0];
  if (!me) return null;
  const rivals = track.filter((r) => !r.me);
  const mine = ZONE_BY_KEY[me.zone];
  const same = rivals.filter((r) => r.zone === me.zone).length;
  return (
    <figure className={"rtrack" + (compact ? " rtrack--compact" : "")} aria-label={`Pace track: ${me.name} in the ${mine.name} lane with ${rivals.length} ${rivals.length === 1 ? "rival" : "rivals"} on Well Run`}>
      <div className="cotrack__oval rtrack__oval">
        <span className="cotrack__flag" aria-hidden="true" />
        {ZONES.map((z) => {
          // Slower first: a same-lane rival lands just before or just after the company.
          const here = track.filter((r) => r.zone === z.key).sort((a, b) => a.score - b.score || (a.me ? -1 : b.me ? 1 : 0));
          const isMine = z.key === me.zone;
          const at = here.length ? here.reduce((s, r) => s + spot(r.score, hi), 0) / here.length : 0;
          const pct = (at * 100).toFixed(1) + "%";
          return (
            <div key={z.key} className={`cotrack__lane rtrack__lane z-${z.key}` + (isMine ? " is-mine" : "") + (here.length ? "" : " is-empty")}>
              <span className="cotrack__lbl">
                {z.name} <small>{z.split}/km</small>
              </span>
              <span className="rtrack__run">
                {here.length > 0 && <i className="rtrack__gap" style={{ flexBasis: pct }} aria-hidden="true" />}
                {here.length > 0 && (
                  <span className="rtrack__pack">
                    {here.map((r) =>
                      r.me ? (
                        <span key={r.slug} className="rtrack__me">
                          <i aria-hidden="true">{r.name.charAt(0)}</i>
                          <b>{r.name}</b>
                        </span>
                      ) : (
                        <Link
                          key={r.slug}
                          href={`/${r.slug}`}
                          prefetch={false}
                          className="rtrack__rv"
                          title={`${r.name} · ${ZONE_BY_KEY[r.zone].name} · open its Well Run page`}
                          onClick={() => cap("rival_clicked", { company: me.name, rival: r.name, zone: r.zone })}
                        >
                          <span className="rtrack__dot" aria-hidden="true">
                            {r.name.charAt(0)}
                            {r.host && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(r.host)}&sz=64`}
                                alt=""
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            )}
                          </span>
                          <span className="rtrack__nm">{r.name}</span>
                        </Link>
                      ),
                    )}
                  </span>
                )}
                {here.length > 0 && <i className="rtrack__gap" style={{ flexBasis: (100 - at * 100).toFixed(1) + "%" }} aria-hidden="true" />}
              </span>
            </div>
          );
        })}
      </div>
      <figcaption>
        {rivals.length > 0 ? (
          <>
            <b>{me.name}</b> runs in the {mine.name} lane{same > 0 ? `, alongside ${same} ${same === 1 ? "rival" : "rivals"}` : ""}. Rivals on Well Run sit in their own pace lanes; further right = more momentum. Tap one to open its page.
          </>
        ) : (
          <>
            <b>{me.name}</b> runs in the {mine.name} lane. None of its direct rivals are on Well Run yet.
          </>
        )}
        {off.length > 0 && (
          <span className="rtrack__off">
            Also competes with: {off.join(", ")}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
