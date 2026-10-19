"use client";

/** Company favicon with a letter fallback underneath. */
export default function Logo({ name, host, className }: { name: string; host: string; className?: string }) {
  const init = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <span className={"logo" + (className ? " " + className : "")} aria-hidden="true">
      <span className="logo__txt">{init}</span>
      {host && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`}
          alt=""
          loading="lazy"
          decoding="async"
          width={32}
          height={32}
          ref={(el) => {
            // The image may fail before hydration attaches onError; catch that case too.
            if (el && el.complete && el.naturalWidth === 0) el.style.display = "none";
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </span>
  );
}

