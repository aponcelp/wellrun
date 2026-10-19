// Shared Sentry options. The DSN is a public key; NEXT_PUBLIC_SENTRY_DSN overrides it.
export const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://12f8505b08286f510edf6966ef6125fa@o4512280291573760.ingest.us.sentry.io/4512280303370240";

export const sentryOptions = {
  dsn: SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV,
  sendDefaultPii: false,
  // Stay quiet locally unless a DSN is set explicitly.
  enabled: process.env.NODE_ENV === "production" || !!process.env.NEXT_PUBLIC_SENTRY_DSN,
};
