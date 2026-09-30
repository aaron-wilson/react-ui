"use client";

import { useEffect } from "react";
import { reportError } from "../src/monitoring/sentry";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => reportError(error), [error]);
  return (
    <main className="surface rounded-2xl p-8">
      <h1 className="text-2xl font-semibold">This view could not load.</h1>
      <p className="mt-3">Your saved trip is still available. Try the view again.</p>
      <button className="primary mt-5" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
