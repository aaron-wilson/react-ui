/** A fresh W3C trace context for each browser request; contains no user or trip data. */
let lastTraceId: string | null = null;
export function getLastTraceId() {
  return lastTraceId;
}
export function newTraceparent() {
  const traceId = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  const spanId = Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  lastTraceId = traceId;
  return `00-${traceId}-${spanId}-01`;
}
