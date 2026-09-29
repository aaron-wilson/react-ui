import { expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "urql";
import { createScopedClient } from "../src/graphql/client";
import { PlanContainer } from "../src/trips/PlanContainer";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
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
  const client = createScopedClient("http://localhost:4000/graphql", () => "demo", transport);
  render(
    <Provider value={client}>
      <PlanContainer />
    </Provider>
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("City"), "Oslo");
  await user.type(screen.getByLabelText("Start date"), "2026-10-01");
  await user.click(screen.getByRole("button", { name: "Create itinerary" }));
  await waitFor(() => expect(push).toHaveBeenCalledWith(`/trip/?id=${tripId}`));
  vi.unstubAllGlobals();
});
