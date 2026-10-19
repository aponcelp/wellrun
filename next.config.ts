import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  trailingSlash: false,
  poweredByHeader: false,
};

// Source maps upload to Sentry only when SENTRY_AUTH_TOKEN is set (Vercel, via the Sentry integration).
// Local/sandbox builds without the token skip the upload and never need network access to Sentry.
const hasToken = !!process.env.SENTRY_AUTH_TOKEN;
export default withSentryConfig(nextConfig, {
  org: "alfredo-ponce-de-leon",
  project: "wellrun",
  silent: true,
  telemetry: false,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !hasToken, deleteSourcemapsAfterUpload: true },
  widenClientFileUpload: hasToken,
});
