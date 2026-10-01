import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { THEME_KEY, ThemeToggle, themeScript } from "../src/components/ThemeToggle";
import { contentTypeFor } from "../scripts/static-types.mjs";
import { ServiceStatus } from "../src/components/ServiceStatus";
import { parsePublicConfig } from "../src/config/public";
import { createScopedClient } from "../src/graphql/client";
import { ListTrips } from "../src/graphql/operations";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

it("rejects unsafe public endpoints and switches themes by keyboard", async () => {
  expect(() =>
    parsePublicConfig({ NEXT_PUBLIC_GRAPHQL_URL: "https://user:secret@example.invalid/graphql" })
  ).toThrow();
  expect(() => parsePublicConfig({ NEXT_PUBLIC_GRAPHQL_URL: "file:///graphql" })).toThrow();
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  render(<ThemeToggle />);
  const toggle = await screen.findByRole("button", { name: "Switch to dark theme" });
  toggle.focus();
  await userEvent.keyboard("{Enter}");
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(localStorage.getItem("wander-theme")).toBe("dark");
});

it("applies a stored theme before paint and otherwise leaves the system preference to CSS", () => {
  const applyStored = () => new Function(themeScript)();
  applyStored();
  expect(document.documentElement.dataset.theme).toBeUndefined();
  localStorage.setItem(THEME_KEY, "dark");
  applyStored();
  expect(document.documentElement.dataset.theme).toBe("dark");
  localStorage.setItem(THEME_KEY, "sepia");
  delete document.documentElement.dataset.theme;
  applyStored();
  expect(document.documentElement.dataset.theme).toBeUndefined();
});

it("follows a dark system preference without storing or forcing a theme", async () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  render(<ThemeToggle />);
  expect(await screen.findByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  expect(document.documentElement.dataset.theme).toBeUndefined();
  expect(localStorage.getItem(THEME_KEY)).toBeNull();
});

it("serves navigation payloads as text so the router does not reload the page", () => {
  expect(contentTypeFor("/out/plan/index.txt")).toBe("text/plain; charset=utf-8");
  expect(contentTypeFor("/out/plan/__next._tree.txt")).toBe("text/plain; charset=utf-8");
  expect(contentTypeFor("/out/index.html")).toBe("text/html; charset=utf-8");
  expect(contentTypeFor("/out/unknown.bin")).toBe("application/octet-stream");
});

it("shows connection errors without exposing a credential", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("", { status: 503 }))
  );
  render(<ServiceStatus />);
  expect(await screen.findByText(/service is offline/)).toBeInTheDocument();
  expect(screen.getByText(/localhost:4000\/graphql/)).toBeInTheDocument();
});

it("isolates GraphQL caches and bearer headers per identity", async () => {
  const calls: string[] = [];
  const transport: typeof fetch = async (_url, init) => {
    calls.push(new Headers(init?.headers).get("Authorization") ?? "anonymous");
    return Response.json({ data: { trips: { items: [], nextCursor: null } } });
  };
  const alice = createScopedClient("http://localhost:4000/graphql", () => "alice", transport);
  const bob = createScopedClient("http://localhost:4000/graphql", () => "bob", transport);
  await alice.query(ListTrips, { first: 10 }).toPromise();
  await alice.query(ListTrips, { first: 10 }).toPromise();
  await bob.query(ListTrips, { first: 10 }).toPromise();
  expect(calls).toEqual(["Bearer alice", "Bearer bob"]);
});
