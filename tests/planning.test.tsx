import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "urql";
import { createScopedClient } from "../src/graphql/client";
import { PlanContainer } from "../src/trips/PlanContainer";
import { AuthProvider } from "../src/auth/AuthProvider";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderPlan(transport: typeof fetch) {
  const client = createScopedClient("http://localhost:4000/graphql", () => "demo", transport);
  render(
    <AuthProvider>
      <Provider value={client}>
        <PlanContainer />
      </Provider>
    </AuthProvider>
  );
}

it("lists saved trips newest first with their dates", async () => {
  const trip = (id: string, city: string, updatedAt: string, dates: string[]) => ({
    __typename: "Trip",
    id,
    city,
    version: 1,
    updatedAt,
    days: dates.map((date, index) => ({ __typename: "Day", id: `${id}-${index}`, date })),
  });
  renderPlan(async () =>
    Response.json({
      data: {
        trips: {
          __typename: "TripPage",
          items: [
            trip("a", "Oslo", "2026-09-01T10:00:00.000Z", ["2026-10-01"]),
            trip("b", "Lisbon", "2026-09-20T10:00:00.000Z", ["2026-10-15", "2026-10-16"]),
          ],
          nextCursor: null,
        },
      },
    })
  );
  const saved = within(await screen.findByRole("region", { name: "Saved trips" }));
  const links = await saved.findAllByRole("link");
  // The export adds the trailing slash; the test router does not.
  expect(links.map((link) => link.getAttribute("href")?.replace("/trip?", "/trip/?"))).toEqual([
    "/trip/?id=b",
    "/trip/?id=a",
  ]);
  expect(links[0]).toHaveTextContent("Lisbon");
  expect(links[0]).toHaveTextContent("Oct 15 – 16, 2026 · 2 days");
  expect(links[1]).toHaveTextContent("Oct 1, 2026 · 1 day");
});

it("explains an empty list and a failed list differently", async () => {
  renderPlan(async () =>
    Response.json({ data: { trips: { __typename: "TripPage", items: [], nextCursor: null } } })
  );
  expect(await screen.findByText(/No trips yet/)).toBeInTheDocument();
  cleanup();
  renderPlan(async () =>
    Response.json({
      errors: [{ message: "Query cost exceeds 500", extensions: { code: "QUERY_TOO_COMPLEX" } }],
    })
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("Could not load saved trips.");
  expect(screen.queryByText(/No trips yet/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Query cost/)).not.toBeInTheDocument();
});

it("asks for the missing details instead of submitting an incomplete plan", async () => {
  const transport = vi.fn<typeof fetch>(async () =>
    Response.json({ data: { trips: { __typename: "TripPage", items: [], nextCursor: null } } })
  );
  renderPlan(transport);
  await userEvent.setup().click(screen.getByRole("button", { name: "Create itinerary" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Enter a city");
  expect(transport.mock.calls.some(([, init]) => String(init?.body).includes("StartCreate"))).toBe(
    false
  );
});

const generationId = "ZGVtbw:00000000-0000-4000-8000-000000000001";
const tripId = "00000000-0000-4000-8000-000000000002";

it("creates a trip through GraphQL and follows the completed SSE stream", async () => {
  const transport: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("/generations/")) {
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer demo");
      const events = [
        { id: generationId, seq: 1, type: "snapshot", status: "running", tripId: null, text: null },
        {
          id: generationId,
          seq: 2,
          type: "chunk",
          status: "running",
          tripId: null,
          text: "A walk",
        },
        { id: generationId, seq: 3, type: "completed", status: "completed", tripId, text: null },
      ]
        .map((event) => `id: ${event.seq}\ndata: ${JSON.stringify(event)}\n\n`)
        .join("");
      return new Response(events, { headers: { "content-type": "text/event-stream" } });
    }
    const body = JSON.parse(String(init?.body)) as { query: string };
    if (body.query.includes("ListTrips"))
      return Response.json({ data: { trips: { items: [], nextCursor: null } } });
    return Response.json({
      data: { startCreateGeneration: { id: generationId, status: "running", tripId: null } },
    });
  };
  vi.stubGlobal("fetch", transport);
  renderPlan(transport);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("City"), "Oslo");
  await user.type(screen.getByLabelText("Start date"), "2026-10-01");
  await user.click(screen.getByRole("button", { name: "Create itinerary" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith(`/trip/?id=${tripId}`));
  expect(screen.getByText("Itinerary ready. Opening it now…")).toBeInTheDocument();
  expect(screen.getByText("A walk")).toBeInTheDocument();
});
