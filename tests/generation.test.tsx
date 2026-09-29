import { expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "urql";
import { createScopedClient } from "../src/graphql/client";
import { useGeneration } from "../src/trips/useGeneration";

const generationId = "ZGVtbw:00000000-0000-4000-8000-000000000003";

it("replaces text with a snapshot and appends later chunks once", async () => {
  const frame = (seq: number, type: string, text: string | null) =>
    `id: ${seq}\ndata: ${JSON.stringify({ id: generationId, seq, type, status: "running", tripId: null, text })}\n\n`;
  const transport: typeof fetch = async (input) => {
    if (String(input).includes("/generations/"))
      return new Response(
        frame(3, "snapshot", "alpha beta ") +
          frame(4, "chunk", "gamma") +
          frame(4, "chunk", "gamma"),
        { headers: { "content-type": "text/event-stream" } }
      );
    return Response.json({
      data: { startCreateGeneration: { id: generationId, status: "running", tripId: null } },
    });
  };
  vi.stubGlobal("fetch", transport);
  const client = createScopedClient("http://localhost:4000/graphql", () => "demo", transport);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider value={client}>{children}</Provider>
  );
  const { result } = renderHook(() => useGeneration(() => "demo"), { wrapper });
  await act(() =>
    result.current.startCreate({
      city: "Oslo",
      startDate: "2026-10-01",
      dayCount: 1,
      preferences: { interests: [], pace: "RELAXED" },
    })
  );
  await waitFor(() => expect(result.current.seq).toBe(4));
  expect(result.current.text).toBe("alpha beta gamma");
  vi.unstubAllGlobals();
});
