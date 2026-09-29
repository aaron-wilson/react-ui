import { expect, it, vi } from "vitest";
import { consumeGeneration } from "../src/trips/stream";
import { decodeShareLink, encodeShareLink } from "../src/trips/shareLink";

const id = "ZGVtbw:00000000-0000-4000-8000-000000000001";
const tripId = "00000000-0000-4000-8000-000000000002";
const frame = (seq: number, type: string, status: string, text: string | null = null) =>
  `id: ${seq}\ndata: ${JSON.stringify({ id, seq, type, status, tripId: type === "completed" ? tripId : null, text })}\n\n`;

it("parses split SSE frames in order and sends bearer authorization in headers", async () => {
  const events: number[] = [];
  const payload = frame(2, "chunk", "running", "Hello ") + frame(3, "completed", "completed");
  const bytes = new TextEncoder().encode(payload);
  const transport = vi.fn(async (_url: URL | RequestInfo, init?: RequestInit) => {
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer demo");
    expect(new Headers(init?.headers).get("Last-Event-ID")).toBe("1");
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(bytes.slice(0, 17));
          controller.enqueue(bytes.slice(17));
          controller.close();
        },
      }),
      { headers: { "content-type": "text/event-stream" } }
    );
  }) as typeof fetch;
  await consumeGeneration(
    "http://localhost:4000/graphql",
    id,
    "demo",
    1,
    new AbortController().signal,
    (event) => events.push(event.seq),
    transport
  );
  expect(events).toEqual([2, 3]);
  expect(transport).toHaveBeenCalledTimes(1);
});

it("keeps share tokens in one static query parameter and rejects malformed links", () => {
  const source = { ownerId: "demo", tripId, token: "private-token" };
  const link = encodeShareLink("", source);
  expect(link).toMatch(/^\/share\/\?token=/);
  expect(decodeShareLink(new URL(link, "http://localhost").searchParams.get("token"))).toEqual(
    source
  );
  expect(decodeShareLink("malformed")).toBeNull();
});
