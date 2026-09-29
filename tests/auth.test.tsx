import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth, AuthProvider } from "../src/auth/AuthProvider";
import { completeAuthorization, createAuthorizationRequest } from "../src/auth/pkce";
import { parsePublicConfig } from "../src/config/public";

function liveConfig() {
  const value = parsePublicConfig({
    NEXT_PUBLIC_APP_MODE: "live",
    NEXT_PUBLIC_COGNITO_DOMAIN: "https://auth.example.test",
    NEXT_PUBLIC_COGNITO_CLIENT_ID: "public-client",
    NEXT_PUBLIC_COGNITO_ISSUER: "https://issuer.example.test/pool",
    NEXT_PUBLIC_AUTH_REDIRECT_URI: "http://localhost:3001/auth/callback/",
  });
  if (value.mode !== "live") throw new Error("Expected live config");
  return value;
}
const config = liveConfig();
const now = 1_780_000_000_000;
function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}
function jwt(claims: object) {
  return `eyJhbGciOiJub25lIn0.${btoa(JSON.stringify(claims)).replace(/=/g, "")}.signature`;
}
async function start() {
  const state = storage();
  const authorize = new URL(
    await createAuthorizationRequest(config, "http://localhost:3001", state, now)
  );
  const callback = new URL(config.cognito.redirectUri);
  callback.searchParams.set("code", "one-time-code");
  callback.searchParams.set("state", authorize.searchParams.get("state") ?? "");
  const transaction = JSON.parse(state.getItem("wander-pkce") ?? "null") as { nonce: string };
  const transport = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = new URLSearchParams(String(init?.body));
    expect(body.get("client_secret")).toBeNull();
    expect(body.get("code_verifier")?.length).toBeGreaterThan(40);
    return Response.json({
      access_token: jwt({
        sub: "user-1",
        iss: config.cognito.issuer,
        client_id: config.cognito.clientId,
        token_use: "access",
        exp: now / 1000 + 3600,
      }),
      id_token: jwt({
        sub: "user-1",
        iss: config.cognito.issuer,
        aud: config.cognito.clientId,
        nonce: transaction.nonce,
        token_use: "id",
        exp: now / 1000 + 3600,
      }),
      token_type: "Bearer",
      expires_in: 3600,
    });
  });
  return { state, authorize, callback, transport };
}

it("exchanges a code with PKCE and keeps only the access token in the returned session", async () => {
  const { state, authorize, callback, transport } = await start();
  expect(authorize.searchParams.get("code_challenge_method")).toBe("S256");
  expect(authorize.searchParams.has("client_secret")).toBe(false);
  const session = await completeAuthorization(config, callback.toString(), state, transport, now);
  expect(session.identity).toBe("user-1");
  expect(session.token).toContain(".signature");
  expect(state.getItem("wander-pkce")).toBeNull();
  expect(transport).toHaveBeenCalledOnce();
});

it("rejects mismatched state and expired transactions before token exchange", async () => {
  const mismatch = await start();
  mismatch.callback.searchParams.set("state", "wrong");
  await expect(
    completeAuthorization(
      config,
      mismatch.callback.toString(),
      mismatch.state,
      mismatch.transport,
      now
    )
  ).rejects.toThrow("Invalid or expired");
  expect(mismatch.transport).not.toHaveBeenCalled();
  const expired = await start();
  await expect(
    completeAuthorization(
      config,
      expired.callback.toString(),
      expired.state,
      expired.transport,
      now + 600_001
    )
  ).rejects.toThrow("Invalid or expired");
  expect(expired.transport).not.toHaveBeenCalled();
});

it("handles callback errors and rejects a demo token in live mode", async () => {
  const failure = await start();
  failure.callback.searchParams.set("error", "access_denied");
  await expect(
    completeAuthorization(
      config,
      failure.callback.toString(),
      failure.state,
      failure.transport,
      now
    )
  ).rejects.toThrow("not completed");
  expect(failure.state.getItem("wander-pkce")).toBeNull();
  const mock = await start();
  await expect(
    completeAuthorization(
      config,
      mock.callback.toString(),
      mock.state,
      async () =>
        Response.json({
          access_token: "demo",
          id_token: "demo",
          token_type: "Bearer",
          expires_in: 3600,
        }),
      now
    )
  ).rejects.toThrow("Invalid sign-in token");
});

it("rejects a mismatched nonce and a callback on another origin", async () => {
  const mismatch = await start();
  const saved = JSON.parse(mismatch.state.getItem("wander-pkce") ?? "null") as Record<
    string,
    unknown
  >;
  mismatch.state.setItem("wander-pkce", JSON.stringify({ ...saved, nonce: "other".repeat(7) }));
  await expect(
    completeAuthorization(
      config,
      mismatch.callback.toString(),
      mismatch.state,
      mismatch.transport,
      now
    )
  ).rejects.toThrow("Invalid sign-in token claims");
  const wrongOrigin = await start();
  wrongOrigin.callback.host = "evil.example.test";
  await expect(
    completeAuthorization(
      config,
      wrongOrigin.callback.toString(),
      wrongOrigin.state,
      wrongOrigin.transport,
      now
    )
  ).rejects.toThrow("does not match this site");
});

function Probe() {
  const auth = useAuth();
  return (
    <>
      <output data-testid="identity">{auth.identity ?? "anonymous"}</output>
      <output data-testid="token">{auth.getToken() ?? "none"}</output>
      <button onClick={auth.signOut}>Sign out</button>
      <button onClick={() => void auth.signIn()}>Continue demo</button>
    </>
  );
}
it("clears the in-memory session and permits a fresh demo identity", async () => {
  render(
    <AuthProvider config={parsePublicConfig({})}>
      <Probe />
    </AuthProvider>
  );
  const user = userEvent.setup();
  expect(screen.getByTestId("token")).toHaveTextContent("demo");
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  expect(screen.getByTestId("identity")).toHaveTextContent("anonymous");
  expect(screen.getByTestId("token")).toHaveTextContent("none");
  await user.click(screen.getByRole("button", { name: "Continue demo" }));
  expect(screen.getByTestId("identity")).toHaveTextContent("demo");
});
