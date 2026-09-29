import { z } from "zod";
import type { PublicConfig } from "../config/public";

type LiveConfig = Extract<PublicConfig, { mode: "live" }>;
const transactionKey = "wander-pkce";
const transactionSchema = z.object({
  state: z.string().min(32),
  nonce: z.string().min(32),
  verifier: z.string().min(43),
  redirectUri: z.url(),
  createdAt: z.number().int(),
});
const tokensSchema = z.object({
  access_token: z.string().min(1),
  id_token: z.string().min(1),
  token_type: z.literal("Bearer"),
  expires_in: z.number().int().positive().max(86400),
});
const idClaimsSchema = z.object({
  sub: z.string().min(1),
  nonce: z.string().min(1),
  iss: z.url(),
  aud: z.string(),
  exp: z.number(),
  token_use: z.literal("id"),
});
const accessClaimsSchema = z.object({
  sub: z.string().min(1),
  iss: z.url(),
  client_id: z.string(),
  exp: z.number(),
  token_use: z.literal("access"),
});

function randomBase64Url() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function decodeClaims(token: string): unknown {
  const payload = token.split(".")[1];
  if (!payload || payload.length > 8192) throw new Error("Invalid sign-in token");
  return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
}
function checkedRedirect(config: LiveConfig, browserOrigin: string) {
  const redirect = new URL(config.cognito.redirectUri);
  if (redirect.origin !== browserOrigin || redirect.pathname !== "/auth/callback/")
    throw new Error("Sign-in callback does not match this site");
  return redirect;
}

export async function createAuthorizationRequest(
  config: LiveConfig,
  browserOrigin: string,
  storage: Pick<Storage, "setItem">,
  now = Date.now()
) {
  const redirect = checkedRedirect(config, browserOrigin);
  const verifier = randomBase64Url();
  const state = randomBase64Url();
  const nonce = randomBase64Url();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  storage.setItem(
    transactionKey,
    JSON.stringify({ state, nonce, verifier, redirectUri: redirect.toString(), createdAt: now })
  );
  const url = new URL("/oauth2/authorize", config.cognito.domain);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: config.cognito.clientId,
    redirect_uri: redirect.toString(),
    scope: "openid",
    state,
    nonce,
    code_challenge_method: "S256",
    code_challenge: challenge,
  }).toString();
  return url.toString();
}

export async function completeAuthorization(
  config: LiveConfig,
  callbackUrl: string,
  storage: Pick<Storage, "getItem" | "removeItem">,
  transport: typeof fetch = fetch,
  now = Date.now()
) {
  const callback = new URL(callbackUrl);
  const redirect = checkedRedirect(config, callback.origin);
  if (callback.pathname.replace(/\/$/, "") !== redirect.pathname.replace(/\/$/, ""))
    throw new Error("Invalid sign-in callback URL");
  const stored = storage.getItem(transactionKey);
  storage.removeItem(transactionKey);
  if (callback.searchParams.has("error")) throw new Error("Sign-in was not completed");
  const transaction = transactionSchema.safeParse(stored ? JSON.parse(stored) : null);
  if (
    !transaction.success ||
    now - transaction.data.createdAt > 10 * 60_000 ||
    now < transaction.data.createdAt ||
    transaction.data.redirectUri !== redirect.toString() ||
    !callback.searchParams.get("state") ||
    callback.searchParams.get("state") !== transaction.data.state ||
    !callback.searchParams.get("code")
  )
    throw new Error("Invalid or expired sign-in transaction");
  const response = await transport(new URL("/oauth2/token", config.cognito.domain), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.cognito.clientId,
      code: callback.searchParams.get("code") ?? "",
      redirect_uri: redirect.toString(),
      code_verifier: transaction.data.verifier,
    }),
  });
  if (!response.ok) throw new Error("Sign-in token exchange failed");
  const tokens = tokensSchema.parse(await response.json());
  const identity = idClaimsSchema.parse(decodeClaims(tokens.id_token));
  const access = accessClaimsSchema.parse(decodeClaims(tokens.access_token));
  if (
    identity.nonce !== transaction.data.nonce ||
    identity.aud !== config.cognito.clientId ||
    identity.iss !== config.cognito.issuer ||
    identity.exp * 1000 <= now ||
    access.client_id !== config.cognito.clientId ||
    access.iss !== config.cognito.issuer ||
    access.sub !== identity.sub ||
    access.exp * 1000 <= now
  )
    throw new Error("Invalid sign-in token claims");
  return {
    identity: identity.sub,
    token: tokens.access_token,
    expiresAt: Math.min(now + tokens.expires_in * 1000, access.exp * 1000),
  };
}
