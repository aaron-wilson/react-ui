import { z } from "zod";

const payload = z.object({
  ownerId: z.string().min(1),
  tripId: z.string().uuid(),
  token: z.string().min(1),
});
export type SharePayload = z.infer<typeof payload>;

export function encodeShareLink(origin: string, input: SharePayload) {
  const encoded = btoa(JSON.stringify(payload.parse(input)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${origin}/share/?token=${encodeURIComponent(encoded)}`;
}

export function decodeShareLink(value: string | null): SharePayload | null {
  if (!value || value.length > 2048) return null;
  try {
    return payload.parse(JSON.parse(atob(value.replace(/-/g, "+").replace(/_/g, "/"))));
  } catch {
    return null;
  }
}
