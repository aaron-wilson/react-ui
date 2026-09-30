import * as Sentry from "@sentry/react";
import type { ErrorEvent } from "@sentry/react";
import { getLastTraceId } from "../telemetry/traceparent";

let enabled = false;

/** Keep only stack positions and event type; discard route, input, auth, and itinerary context. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const traceId = getLastTraceId();
  return {
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: event.platform,
    level: event.level,
    release: event.release,
    type: undefined,
    exception: event.exception
      ? {
          values: event.exception.values?.map((value) => ({
            type: value.type,
            value: "Client error",
            stacktrace: value.stacktrace
              ? {
                  frames: value.stacktrace.frames?.map((frame) => ({
                    filename: frame.filename?.includes("/_next/static/")
                      ? frame.filename.split("?")[0]
                      : "[redacted]",
                    lineno: frame.lineno,
                    colno: frame.colno,
                    function: frame.function,
                  })),
                }
              : undefined,
          })),
        }
      : undefined,
    tags: traceId ? { backend_trace_id: traceId } : undefined,
  };
}

export function initMonitoring(
  dsn: string | null,
  release: string | null,
  transport?: NonNullable<Parameters<typeof Sentry.init>[0]>["transport"]
) {
  if (!dsn || enabled || typeof window === "undefined") return false;
  Sentry.init({
    dsn,
    release: release ?? undefined,
    transport,
    defaultIntegrations: false,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    tracePropagationTargets: [],
    beforeSend: scrubEvent,
    beforeSendSpan(span) {
      span.attributes = {};
      span.name = "UI operation";
      span.links = [];
      return span;
    },
  });
  enabled = true;
  return true;
}

export function reportError(error: unknown) {
  if (enabled) Sentry.captureException(error);
}
