import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "urql";
import { AuthProvider } from "../src/auth/AuthProvider";
import { createScopedClient } from "../src/graphql/client";
import { TripContainer } from "../src/trips/TripContainer";

const tripId = "00000000-0000-4000-8000-000000000010";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams({ id: "00000000-0000-4000-8000-000000000010" }),
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const activity = (id: string, title: string, pinned = false) => ({
  __typename: "Activity",
  id,
  title,
  pinned,
});
const trip = (
  version: number,
  activities: ReturnType<typeof activity>[],
  share: unknown = null
) => ({
  __typename: "Trip",
  id: tripId,
  ownerId: "demo",
  city: "Lisbon",
  version,
  updatedAt: new Date().toISOString(),
  preferences: { __typename: "Preferences", interests: ["food"], pace: "BALANCED" },
  days: [{ __typename: "Day", id: "day-1", date: "2026-10-15", activities }],
  share,
});

function renderTrip(respond: (query: string, variables: Record<string, unknown>) => unknown) {
  const sent: { query: string; variables: Record<string, unknown> }[] = [];
  const transport: typeof fetch = async (_input, init) => {
    // urql sends short queries as GET and mutations as POST.
    const url = new URL(String(_input));
    const body: (typeof sent)[number] = init?.body
      ? JSON.parse(String(init.body))
      : {
          query: url.searchParams.get("query") ?? "",
          variables: JSON.parse(url.searchParams.get("variables") ?? "{}"),
        };
    sent.push(body);
    return Response.json(respond(body.query, body.variables));
  };
  const client = createScopedClient("http://localhost:4000/graphql", () => "demo", transport);
  render(
    <AuthProvider>
      <Provider value={client}>
        <TripContainer />
      </Provider>
    </AuthProvider>
  );
  return sent;
}

it("shows the itinerary with readable dates and no internal version", async () => {
  renderTrip(() => ({
    data: {
      trip: trip(3, [activity("a", "Visit the tile museum", true), activity("b", "Try pastries")]),
    },
  }));
  expect(await screen.findByRole("heading", { name: "Lisbon" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Thursday, October 15" })).toBeInTheDocument();
  expect(screen.getByText(/Oct 15, 2026 · 1 day · Balanced pace/)).toBeInTheDocument();
  expect(screen.queryByText(/Version/)).not.toBeInTheDocument();
  expect(screen.getByText("Pinned", { exact: true })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Unpin Visit the tile museum" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Swap Visit the tile museum" })).toBeNull();
  expect(screen.getByRole("radio", { name: "Balanced" })).toBeChecked();
});

it("swaps an activity through a disclosed form and explains a version conflict", async () => {
  let swaps = 0;
  const sent = renderTrip((query) => {
    if (query.includes("SwapActivity")) {
      swaps++;
      return {
        errors: [{ message: "Trip version conflict", extensions: { code: "CONFLICT" } }],
      };
    }
    return { data: { trip: trip(3 + swaps, [activity("b", "Try pastries")]) } };
  });
  const user = userEvent.setup();
  expect(screen.queryByLabelText(/Replacement for/)).toBeNull();
  await user.click(await screen.findByRole("button", { name: "Swap Try pastries" }));
  const row = within(screen.getByText("Try pastries").closest("li") as HTMLElement);
  await user.click(row.getByRole("button", { name: "Replace" }));
  expect(row.getByRole("alert")).toHaveTextContent("Enter a replacement");
  await user.type(row.getByLabelText("Replacement for Try pastries"), "A quiet gallery");
  await user.click(row.getByRole("button", { name: "Replace" }));
  const alerts = await screen.findAllByRole("alert");
  expect(alerts.some((alert) => /changed somewhere else/.test(alert.textContent ?? ""))).toBe(true);
  const swap = sent.find((request) => request.query.includes("SwapActivity"));
  expect(swap?.variables).toEqual({
    input: { tripId, version: 3, activityId: "b", title: "A quiet gallery" },
  });
  // The conflict reloads the trip so the next attempt carries the stored version.
  expect(sent.filter((request) => request.query.includes("TripDetails")).length).toBe(2);
});

it("offers a copyable absolute share link with its expiry", async () => {
  const writeText = vi.fn(async () => undefined);
  renderTrip(() => ({
    data: {
      trip: trip(4, [activity("b", "Try pastries")], {
        __typename: "ShareLink",
        token: "share-token",
        expiresAt: "2026-10-08T12:00:00.000Z",
      }),
    },
  }));
  const user = userEvent.setup();
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  const link = await screen.findByRole("link", { name: /\/share\/?\?token=/ });
  expect(link.textContent).toMatch(/^http:\/\/localhost(:\d+)?\/share\/\?token=/);
  expect(screen.getByText(/Expires Oct \d+\./)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Copy link" }));
  expect(writeText).toHaveBeenCalledWith(link.textContent);
  expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
});
