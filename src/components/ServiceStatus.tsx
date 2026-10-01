"use client";

import { useEffect, useState } from "react";
import { publicConfig } from "../config/public";

const messages = {
  checking: "Checking the planning service…",
  ready: "Planning service ready",
  offline: "The planning service is offline.",
} as const;

/** A quiet footer indicator; it names the endpoint only when the service cannot be reached. */
export function ServiceStatus() {
  const [state, setState] = useState<keyof typeof messages>("checking");
  useEffect(() => {
    const controller = new AbortController();
    fetch(new URL("/health", publicConfig.graphqlUrl), { signal: controller.signal })
      .then((response) => setState(response.ok ? "ready" : "offline"))
      .catch(() => {
        if (!controller.signal.aborted) setState("offline");
      });
    return () => controller.abort();
  }, []);
  return (
    <p aria-live="polite" className="flex flex-wrap items-center gap-2">
      <span className="status-dot" data-state={state} aria-hidden="true" />
      <span>{messages[state]}</span>
      {state === "offline" && (
        <span>
          No response from <code className="break-all">{publicConfig.graphqlUrl}</code>.
        </span>
      )}
    </p>
  );
}
