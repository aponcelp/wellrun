// PostHog events, named exactly as on the original site (script#wr-track).
type Props = Record<string, unknown>;
declare global {
  interface Window {
    posthog?: { capture?: (name: string, props?: Props) => void };
  }
}
export function cap(name: string, props?: Props) {
  try {
    if (typeof window !== "undefined" && window.posthog && window.posthog.capture) window.posthog.capture(name, props || {});
  } catch {
    /* never let analytics break the page */
  }
}
