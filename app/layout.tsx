import type { Metadata, Viewport } from "next";
import { Anton, IBM_Plex_Mono, Inter } from "next/font/google";
import { SITE } from "@/lib/rank";
import Built from "@/components/Built";
import "./globals.css";

const display = Anton({ weight: "400", subsets: ["latin"], variable: "--f-display", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--f-sans", display: "swap" });
const mono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--f-mono", display: "swap" });

const DESC = "Private startups that run well. Paced by funding and buzz, curated daily.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Well Run · Startups that run well",
  description: DESC,
  alternates: { canonical: "/" },
  icons: { icon: { url: "/favicon.svg", type: "image/svg+xml" }, apple: "/favicon.svg" },
  openGraph: {
    type: "website",
    url: SITE + "/",
    siteName: "Well Run",
    title: "Well Run · Startups that run well",
    description: DESC,
    // og:image comes from app/opengraph-image.tsx; /og.png stays in public/ as the legacy card.
  },
  twitter: { card: "summary_large_image", images: [{ url: "/opengraph-image", width: 1200, height: 630 }] },
  // Google Search Console ownership (same token as main's index.html, 17a088f); keep through launch.
  verification: { google: "_JCXbGJ7vU0_NDU_WMynTgqRy7ZSxeA3mnUybxotF3c" },
};

export const viewport: Viewport = { themeColor: "#0A2119", width: "device-width", initialScale: 1 };

// PostHog snippet and the ?me=1 opt-out, unchanged from the original site.
const POSTHOG = `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);posthog.init('phc_xnbHgX897rLb6KBHRsq4ifStwhzhS7xK9odacZhGvvtW',{api_host:'https://us.i.posthog.com',defaults:'2025-05-24',person_profiles:'identified_only'});try{if(/[?&]me=1/.test(location.search))localStorage.setItem('wr_me','1');if(localStorage.getItem('wr_me')==='1')posthog.opt_out_capturing()}catch(e){};`;
const VERCEL_VA = `window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: VERCEL_VA }} />
        <script defer src="/_vercel/insights/script.js" />
        <script dangerouslySetInnerHTML={{ __html: POSTHOG }} />
      </head>
      <body>
        {children}
        <footer className="foot">
          <Built />
          <p className="foot__by">
            Well Run is a side project by{" "}
            <a href="https://www.linkedin.com/in/alfredoponcedeleon" target="_blank" rel="noopener">Alfredo Ponce de León</a>
          </p>
        </footer>
      </body>
    </html>
  );
}
