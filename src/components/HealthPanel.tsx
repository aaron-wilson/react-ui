"use client";

import { useEffect, useState } from "react";
import { publicConfig } from "../config/public";

export function HealthPanel() {
  const [state, setState] = useState<"checking" | "ready" | "offline">("checking");
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
    <section aria-live="polite" className="surface rounded-2xl p-6">
      <p className="eyebrow">Local setup</p>
      <h2 className="mt-2 text-xl font-semibold">GraphQL service</h2>
      <p className="mt-2 text-sm">
        {state === "checking"
          ? "Checking the connection…"
          : state === "ready"
            ? "Connected and ready to plan."
            : "The service is offline. Start GraphQL and REST, then reload."}
      </p>
      <code className="mt-4 block break-all text-xs opacity-75">{publicConfig.graphqlUrl}</code>
    </section>
  );
}
