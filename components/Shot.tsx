"use client";
import { useState } from "react";
import type { OgImage } from "@/lib/types";

/**
 * A company's own landing-page preview image (hotlinked), in a fixed-ratio frame so nothing jumps.
 * Icons (no og:image on the site) sit centered on paper instead of being stretched. Hides itself if the image fails.
 */
export default function Shot({ og, name, className, eager }: { og: OgImage; name: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <span className={"shot" + (og.kind === "icon" ? " shot--icon" : "") + (className ? " " + className : "")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={og.url}
        alt={`${name}'s website preview`}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        ref={(el) => {
          if (el && el.complete && el.naturalWidth === 0) setFailed(true);
        }}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
