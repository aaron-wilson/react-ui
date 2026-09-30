import * as Sentry from "@sentry/react";
import { describe, expect, it } from "vitest";
import { getLastTraceId, newTraceparent } from "../src/telemetry/traceparent";
import { initMonitoring, reportError, scrubEvent } from "../src/monitoring/sentry";

describe("optional browser monitoring", () => {
  it("does not initialize an SDK or transport without a DSN", () => {
    let initialized = false;
    expect(
      initMonitoring(null, null, () => {
        initialized = true;
        throw new Error("unexpected");
      })
    ).toBe(false);
    expect(initialized).toBe(false);
  });

  it("removes sensitive event context and keeps a safe trace correlation", () => {
    const header = newTraceparent();
    expect(getLastTraceId()).toBe(header.split("-")[1]);
    const event = scrubEvent({
      type: undefined,
      message: "secret itinerary",
      request: { url: "https://example.test/share/?token=secret" },
      user: { email: "private@example.test" },
      extra: { token: "private" },
      breadcrumbs: [{ message: "private input" }],
      exception: { values: [{ type: "Error", value: "secret itinerary" }] },
    });
    expect(JSON.stringify(event)).not.toMatch(/secret|private|example\.test/);
    expect(event.exception?.values?.[0]?.value).toBe("Client error");
    expect(event.tags?.backend_trace_id).toBe(getLastTraceId());
  });

  it("sends only scrubbed errors through an injected transport", async () => {
    const payloads: string[] = [];
    expect(
      initMonitoring("https://abc@o0.ingest.sentry.io/123", "test-release", () => ({
        send(envelope) {
          payloads.push(JSON.stringify(envelope));
          return Promise.resolve({ statusCode: 200 });
        },
        flush() {
          return Promise.resolve(true);
        },
      }))
    ).toBe(true);
    reportError(new Error("private itinerary text"));
    await Sentry.flush(1000);
    expect(payloads.some((payload) => payload.includes("Client error"))).toBe(true);
    expect(payloads.join(" ")).not.toContain("private itinerary text");
  });
});
