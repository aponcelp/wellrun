import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  trailingSlash: false,
  poweredByHeader: false,
};

// Error capture only: no source-map upload (no SENTRY_AUTH_TOKEN yet) and no build telemetry,
// so the build never needs network access to Sentry.
export default withSentryConfig(nextConfig, {
  org: "alfredo-ponce-de-leon",
  project: "wellrun",
  silent: true,
  telemetry: false,
  sourcemaps: { disable: true },
  widenClientFileUpload: false,
});
