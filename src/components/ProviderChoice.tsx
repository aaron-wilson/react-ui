"use client";

import { useState } from "react";

export function ProviderChoice() {
  const [choice, setChoice] = useState("mock");
  return (
    <section className="surface rounded-2xl p-5" aria-label="Provider choice example">
      <label htmlFor="provider-choice" className="font-semibold">
        Try a provider setting
      </label>
      <select
        id="provider-choice"
        value={choice}
        onChange={(event) => setChoice(event.target.value)}
        className="ml-3 rounded border p-2"
      >
        <option value="mock">Mock</option>
        <option value="wttr">wttr</option>
      </select>
      <p className="mt-3">
        <code>PROVIDER_WEATHER={choice}</code>
      </p>
      <p className="text-sm opacity-75">
        This example only shows configuration; it makes no provider request.
      </p>
    </section>
  );
}
