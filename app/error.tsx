"use client";

import { useEffect } from "react";
import { reportError } from "../src/monitoring/sentry";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => reportError(error), [error]);
  return (
    <main className="py-20">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display mt-4 text-4xl md:text-5xl">This view could not load.</h1>
      <p className="muted mt-4 max-w-md">Your saved trips are not affected. Try the view again.</p>
      <button className="primary mt-8" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
