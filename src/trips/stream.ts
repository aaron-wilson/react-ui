import { z } from "zod";
import { newTraceparent } from "../telemetry/traceparent";

export const generationEventSchema = z.object({
  id: z.string().min(1),
  seq: z.number().int().nonnegative(),
  type: z.enum(["snapshot", "progress", "chunk", "completed", "failed", "cancelled"]),
  status: z.enum(["running", "completed", "failed", "cancelled", "interrupted"]),
  tripId: z.string().uuid().nullable(),
  text: z.string().max(4000).nullable(),
});
export type GenerationEvent = z.infer<typeof generationEventSchema>;

export async function consumeGeneration(
  graphqlUrl: string,
  id: string,
  token: string,
  after: number,
  signal: AbortSignal,
  onEvent: (event: GenerationEvent) => void,
  transport: typeof fetch = fetch
) {
  const url = new URL(`/generations/${encodeURIComponent(id)}/events`, graphqlUrl);
  const response = await transport(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
      traceparent: newTraceparent(),
      ...(after ? { "Last-Event-ID": String(after) } : {}),
    },
    signal,
  });
  if (
    !response.ok ||
    !response.body ||
    !response.headers.get("content-type")?.includes("text/event-stream")
  )
    throw new Error("Generation stream unavailable");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      if (pending.length > 16_384) throw new Error("Generation frame too large");
      let boundary = pending.indexOf("\n\n");
      while (boundary >= 0) {
        const frame = pending.slice(0, boundary);
        pending = pending.slice(boundary + 2);
        const data = frame
          .split("\n")
          .find((line) => line.startsWith("data: "))
          ?.slice(6);
        if (data) {
          const event = generationEventSchema.parse(JSON.parse(data));
          if (event.id === id) onEvent(event);
          if (event.status !== "running") return;
        }
        boundary = pending.indexOf("\n\n");
      }
    }
    throw new Error("Generation stream ended before completion");
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
