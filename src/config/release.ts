import type { PublicConfig } from "./public.ts";

/**
 * A live release must agree with itself: HTTPS everywhere, the sign-in callback on the site's
 * own origin, and the GraphQL API on a different origin from the static site. Messages name
 * settings, never their values.
 */
export function assertReleaseConfig(config: PublicConfig, siteOrigin: string) {
  if (config.mode !== "live") return;
  const site = new URL(siteOrigin);
  const graph = new URL(config.graphqlUrl);
  if (site.protocol !== "https:") throw new Error("Live UI_SITE_ORIGIN must use HTTPS");
  if (graph.protocol !== "https:") throw new Error("Live NEXT_PUBLIC_GRAPHQL_URL must use HTTPS");
  if (new URL(config.cognito.redirectUri).origin !== site.origin)
    throw new Error("NEXT_PUBLIC_AUTH_REDIRECT_URI must be on UI_SITE_ORIGIN");
  if (graph.origin === site.origin)
    throw new Error("NEXT_PUBLIC_GRAPHQL_URL and UI_SITE_ORIGIN must be different origins");
}
