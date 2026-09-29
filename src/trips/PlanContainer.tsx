"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "urql";
import { z } from "zod";
import { useAuth } from "../auth/AuthProvider";
import { ListTrips } from "../graphql/operations";
import { useGeneration } from "./useGeneration";

const formSchema = z.object({
  city: z.string().trim().min(1).max(100),
  startDate: z.iso.date(),
  dayCount: z.number().int().min(1).max(30),
  interests: z.array(z.string().min(1).max(80)).max(20),
  pace: z.enum(["RELAXED", "BALANCED", "BUSY"]),
});

export function PlanContainer() {
  const router = useRouter();
  const { identity, getToken, signIn } = useAuth();
  const generation = useGeneration(getToken);
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dayCount, setDayCount] = useState(2);
  const [interests, setInterests] = useState("");
  const [pace, setPace] = useState<"RELAXED" | "BALANCED" | "BUSY">("BALANCED");
  const [formError, setFormError] = useState<string | null>(null);
  const [{ data, fetching, error }, reload] = useQuery({
    query: ListTrips,
    variables: { first: 20 },
    pause: !identity,
  });
  useEffect(() => {
    if (generation.status === "completed" && generation.tripId)
      router.push(`/trip/?id=${encodeURIComponent(generation.tripId)}`);
  }, [generation.status, generation.tripId, router]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = formSchema.safeParse({
      city,
      startDate,
      dayCount,
      interests: interests
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      pace,
    });
    if (!parsed.success) {
      setFormError("Enter a city, valid start date, and one to 30 days.");
      return;
    }
    setFormError(null);
    await generation.startCreate({
      city: parsed.data.city,
      startDate: parsed.data.startDate,
      dayCount: parsed.data.dayCount,
      preferences: { interests: parsed.data.interests, pace: parsed.data.pace },
    });
  };
  if (!identity)
    return (
      <main className="py-16">
        <h1 className="text-3xl font-semibold">Sign in to plan a trip</h1>
        <button className="primary mt-6" onClick={() => void signIn()}>
          Sign in
        </button>
      </main>
    );
  return (
    <main className="pb-16">
      <p className="eyebrow mt-12">New journey</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Where to next?</h1>
      <p className="mt-3 max-w-xl opacity-75">
        Give us a starting point. You can pin the parts you love and change the rest later.
      </p>
      <div className="mt-8 grid gap-7 lg:grid-cols-[1.4fr_1fr]">
        <form className="surface grid gap-5 rounded-2xl p-6" onSubmit={submit}>
          <label className="field">
            City
            <input
              required
              maxLength={100}
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Lisbon"
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="field">
              Start date
              <input
                required
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label className="field">
              Days
              <input
                required
                type="number"
                min={1}
                max={30}
                value={dayCount}
                onChange={(event) => setDayCount(Number(event.target.value))}
              />
            </label>
          </div>
          <label className="field">
            Interests <span className="text-xs opacity-75">(separate with commas)</span>
            <input
              value={interests}
              onChange={(event) => setInterests(event.target.value)}
              placeholder="art, food, parks"
            />
          </label>
          <label className="field">
            Pace
            <select value={pace} onChange={(event) => setPace(event.target.value as typeof pace)}>
              <option value="RELAXED">Relaxed</option>
              <option value="BALANCED">Balanced</option>
              <option value="BUSY">Busy</option>
            </select>
          </label>
          {formError && (
            <p role="alert" className="error">
              {formError}
            </p>
          )}
          <button className="primary" type="submit" disabled={generation.status === "running"}>
            {generation.status === "running" ? "Planning…" : "Create itinerary"}
          </button>
        </form>
        <section className="surface rounded-2xl p-6" aria-live="polite">
          <p className="eyebrow">Live itinerary</p>
          <h2 className="mt-2 text-xl font-semibold">Planning notes</h2>
          {generation.status === "idle" ? (
            <p className="mt-4 opacity-75">Your plan will appear here as it takes shape.</p>
          ) : (
            <p className="mt-4">Status: {generation.status}</p>
          )}
          {generation.text && <p className="mt-4 whitespace-pre-wrap">{generation.text}</p>}
          {generation.error && (
            <p role="alert" className="error mt-4">
              {generation.error}
            </p>
          )}
          {generation.status === "interrupted" && (
            <button className="control mt-4" type="button" onClick={generation.reconnect}>
              Reconnect
            </button>
          )}
        </section>
      </div>
      <section className="mt-12" aria-labelledby="saved-heading">
        <div className="flex items-center justify-between">
          <h2 id="saved-heading" className="text-2xl font-semibold">
            Saved trips
          </h2>
          <button
            className="control"
            type="button"
            onClick={() => reload({ requestPolicy: "network-only" })}
          >
            Refresh
          </button>
        </div>
        {fetching && <p className="mt-4">Loading trips…</p>}
        {error && (
          <p role="alert" className="error mt-4">
            Could not load saved trips.
          </p>
        )}
        {!fetching && !error && data?.trips.items.length === 0 && (
          <p className="mt-4 opacity-75">No trips yet. Start with a city above.</p>
        )}
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {data?.trips.items.map((trip) => (
            <li key={trip.id}>
              <Link
                className="surface block rounded-xl p-5 hover:underline"
                href={`/trip/?id=${encodeURIComponent(trip.id)}`}
              >
                {trip.city}
                <span className="block text-xs opacity-75">
                  Updated {new Date(trip.updatedAt).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
