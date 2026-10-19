// Browser error capture (no session replay). Sentry loads after the page has finished loading
// so it never competes with the board's first paint; errors before that point are not captured.
import { sentryOptions } from "./lib/sentry-config";

function start() {
  import("@sentry/nextjs")
    .then((Sentry) => Sentry.init({ ...sentryOptions }))
    .catch(() => {});
}

if (typeof window !== "undefined") {
  const idle = (fn: () => void) =>
    "requestIdleCallback" in window ? window.requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 1500);
  if (document.readyState === "complete") idle(start);
  else window.addEventListener("load", () => idle(start), { once: true });
}
