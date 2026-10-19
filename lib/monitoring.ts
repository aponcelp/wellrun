// One place to report handled errors from the browser. Sentry itself is loaded lazily
// (see instrumentation-client.ts), so it is imported on demand here too.
export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") console.error("[wellrun]", error, context || "");
  import("@sentry/nextjs")
    .then((Sentry) => Sentry.captureException(error, context ? { extra: context } : undefined))
    .catch(() => {});
}
