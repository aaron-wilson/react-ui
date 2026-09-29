import { afterEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "../src/components/ThemeToggle";
import { HealthPanel } from "../src/components/HealthPanel";
import { parsePublicConfig } from "../src/config/public";
import { createScopedClient } from "../src/graphql/client";
import { ListTrips } from "../src/graphql/operations";

afterEach(() => {
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

it("shows connection errors without exposing a credential", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("", { status: 503 }))
  );
  render(<HealthPanel />);
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
