interface PublicInput {
  NEXT_PUBLIC_GRAPHQL_URL?: string;
  NEXT_PUBLIC_APP_MODE?: string;
  NEXT_PUBLIC_COGNITO_DOMAIN?: string;
  NEXT_PUBLIC_COGNITO_CLIENT_ID?: string;
  NEXT_PUBLIC_COGNITO_ISSUER?: string;
  NEXT_PUBLIC_AUTH_REDIRECT_URI?: string;
  NEXT_PUBLIC_COGNITO_CLIENT_SECRET?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  NEXT_PUBLIC_SENTRY_RELEASE?: string;
}
export type PublicConfig =
  | {
      graphqlUrl: string;
      mode: "demo";
      cognito: null;
      sentryDsn: string | null;
      sentryRelease: string | null;
    }
  | {
      graphqlUrl: string;
      mode: "live";
      cognito: { domain: string; clientId: string; issuer: string; redirectUri: string };
      sentryDsn: string | null;
      sentryRelease: string | null;
    };

export function parsePublicConfig(input: PublicInput): PublicConfig {
  const sentryDsn = input.NEXT_PUBLIC_SENTRY_DSN || null;
  if (sentryDsn && new URL(sentryDsn).protocol !== "https:")
    throw new Error("Invalid public Sentry DSN");
  const sentryRelease = input.NEXT_PUBLIC_SENTRY_RELEASE || null;
  const url = new URL(input.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.endsWith("/graphql")
  )
    throw new Error("Invalid NEXT_PUBLIC_GRAPHQL_URL");
  if (input.NEXT_PUBLIC_COGNITO_CLIENT_SECRET)
    throw new Error("A public Cognito client cannot have a secret");
  const mode = input.NEXT_PUBLIC_APP_MODE || "demo";
  if (mode === "demo")
    return Object.freeze({
      graphqlUrl: url.toString(),
      mode,
      cognito: null,
      sentryDsn,
      sentryRelease,
    });
  if (mode !== "live") throw new Error("Invalid NEXT_PUBLIC_APP_MODE");
  const {
    NEXT_PUBLIC_COGNITO_DOMAIN: rawDomain,
    NEXT_PUBLIC_COGNITO_CLIENT_ID: clientId,
    NEXT_PUBLIC_COGNITO_ISSUER: rawIssuer,
    NEXT_PUBLIC_AUTH_REDIRECT_URI: rawRedirect,
  } = input;
  if (!rawDomain || !clientId || !rawIssuer || !rawRedirect)
    throw new Error("Missing Cognito public configuration");
  const domain = new URL(rawDomain);
  const issuer = new URL(rawIssuer);
  const redirect = new URL(rawRedirect);
  if (
    domain.protocol !== "https:" ||
    domain.origin !== domain.toString().replace(/\/$/, "") ||
    issuer.protocol !== "https:" ||
    issuer.pathname === "/" ||
    issuer.search ||
    issuer.hash ||
    issuer.username ||
    issuer.password ||
    !["https:", "http:"].includes(redirect.protocol) ||
    (redirect.protocol === "http:" && !["localhost", "127.0.0.1"].includes(redirect.hostname)) ||
    redirect.pathname !== "/auth/callback/" ||
    redirect.search ||
    redirect.hash ||
    redirect.username ||
    redirect.password
  )
    throw new Error("Invalid Cognito public configuration");
  return Object.freeze({
    graphqlUrl: url.toString(),
    mode,
    cognito: {
      domain: domain.origin,
      clientId,
      issuer: issuer.toString().replace(/\/$/, ""),
      redirectUri: redirect.toString(),
    },
    sentryDsn,
    sentryRelease,
  });
}

export const publicConfig = parsePublicConfig({
  NEXT_PUBLIC_GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  NEXT_PUBLIC_APP_MODE: process.env.NEXT_PUBLIC_APP_MODE,
  NEXT_PUBLIC_COGNITO_DOMAIN: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
  NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  NEXT_PUBLIC_COGNITO_ISSUER: process.env.NEXT_PUBLIC_COGNITO_ISSUER,
  NEXT_PUBLIC_AUTH_REDIRECT_URI: process.env.NEXT_PUBLIC_AUTH_REDIRECT_URI,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_RELEASE: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
});
