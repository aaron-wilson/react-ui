"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "urql";
import { z } from "zod";
import { useAuth } from "../auth/AuthProvider";
import { Icon } from "../components/Icon";
import { PaceField } from "../components/PaceField";
import { friendlyError } from "../graphql/errors";
import { ListTrips } from "../graphql/operations";
import { dayCount, formatRange, formatUpdated, type PaceValue } from "../lib/format";
import { GenerationNotes } from "./GenerationNotes";
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
  const [days, setDays] = useState("2");
  const [interests, setInterests] = useState("");
  const [pace, setPace] = useState<PaceValue>("BALANCED");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // A trip created through a generation never passes through this query's cache entry, so a
  // cached list would hide it on return; always confirm against the network.
  const [{ data, fetching, error }, reload] = useQuery({
    query: ListTrips,
    variables: { first: 20 },
    pause: !identity,
    requestPolicy: "cache-and-network",
  });
  const trips = useMemo(
    () => [...(data?.trips.items ?? [])].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [data]
  );
  useEffect(() => {
    if (generation.status === "completed" && generation.tripId)
      router.push(`/trip/?id=${encodeURIComponent(generation.tripId)}`);
  }, [generation.status, generation.tripId, router]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = formSchema.safeParse({
      city,
      startDate,
      dayCount: Number(days),
      interests: interests
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      pace,
    });
    if (!parsed.success) {
      setFormError("Enter a city, a valid start date, and between 1 and 30 days.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await generation.startCreate({
        city: parsed.data.city,
        startDate: parsed.data.startDate,
        dayCount: parsed.data.dayCount,
        preferences: { interests: parsed.data.interests, pace: parsed.data.pace },
      });
    } finally {
      setSubmitting(false);
    }
  };
  if (!identity)
    return (
      <main className="py-20">
        <p className="eyebrow">Your trips</p>
        <h1 className="display mt-4 text-4xl md:text-5xl">Sign in to plan a trip</h1>
        <p className="muted mt-4 max-w-md">Your itineraries are saved to your account.</p>
        <button className="primary mt-8" onClick={() => void signIn()}>
          Sign in
        </button>
      </main>
    );
  const busy = submitting || generation.status === "running";
  const opening = generation.status === "completed";
  return (
    <main className="pb-10">
      <p className="eyebrow mt-10">New journey</p>
      <h1 className="display mt-3 text-4xl md:text-5xl">Where to next?</h1>
      <p className="muted mt-3 max-w-xl">
        Give us a starting point. You can pin the parts you love and change the rest later.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <form className="surface grid gap-5 rounded-2xl p-6" onSubmit={submit} noValidate>
          <label className="field">
            City
            <input
              required
              maxLength={100}
              autoComplete="off"
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
                inputMode="numeric"
                min={1}
                max={30}
                value={days}
                onChange={(event) => setDays(event.target.value)}
              />
            </label>
          </div>
          <div className="field">
            <label htmlFor="plan-interests">Interests</label>
            <input
              id="plan-interests"
              value={interests}
              onChange={(event) => setInterests(event.target.value)}
              placeholder="art, food, parks"
              aria-describedby="plan-interests-hint"
            />
            <span id="plan-interests-hint" className="hint">
              Optional. Separate with commas.
            </span>
          </div>
          <PaceField value={pace} onChange={setPace} />
          {formError && (
            <p role="alert" className="notice error text-sm">
              {formError}
            </p>
          )}
          <button className="primary" type="submit" disabled={busy || opening}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {busy ? "Planning…" : "Create itinerary"}
          </button>
        </form>
        <section className="surface rounded-2xl p-6" aria-labelledby="notes-heading">
          <p className="eyebrow">Live itinerary</p>
          <h2 id="notes-heading" className="display mt-2 text-2xl">
            Planning notes
          </h2>
          <div className="mt-4">
            <GenerationNotes
              generation={generation}
              running={`Planning your days${city.trim() ? ` in ${city.trim()}` : ""}…`}
              completed="Itinerary ready. Opening it now…"
              idle={
                <p className="muted">
                  Notes appear here while your plan takes shape. It usually takes a few seconds.
                </p>
              }
            />
          </div>
        </section>
      </div>
      <section className="mt-14" aria-labelledby="saved-heading">
        <div className="flex items-center justify-between gap-4">
          <h2 id="saved-heading" className="display text-3xl">
            Saved trips
          </h2>
          <button
            className="control btn-sm"
            type="button"
            disabled={fetching}
            onClick={() => reload({ requestPolicy: "network-only" })}
          >
            <Icon name="refresh" size={16} />
            Refresh
          </button>
        </div>
        {error && (
          <div role="alert" className="notice mt-5">
            <p className="error">Could not load saved trips.</p>
            <p className="mt-1 text-sm">{friendlyError(error, "Try again in a moment.")}</p>
          </div>
        )}
        {fetching && !data && (
          <div
            role="status"
            aria-label="Loading saved trips"
            className="mt-5 grid gap-3 sm:grid-cols-2"
          >
            {[0, 1].map((item) => (
              <div key={item} className="surface rounded-xl p-5">
                <div className="skeleton h-6 w-2/5" />
                <div className="skeleton mt-3 h-4 w-3/5" />
              </div>
            ))}
          </div>
        )}
        {!fetching && !error && trips.length === 0 && (
          <p className="surface-flat muted mt-5 rounded-xl p-6">
            No trips yet. Start with a city above and your first itinerary will be saved here.
          </p>
        )}
        {trips.length > 0 && (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {trips.map((trip) => {
              const range = formatRange(trip.days.map((day) => day.date));
              return (
                <li key={trip.id}>
                  <Link
                    className="surface card-link flex items-center justify-between gap-4 rounded-xl p-5"
                    href={`/trip/?id=${encodeURIComponent(trip.id)}`}
                  >
                    <span>
                      <span className="display block text-xl">{trip.city}</span>
                      <span className="muted mt-1 block text-sm">
                        {[range, dayCount(trip.days.length)].filter(Boolean).join(" · ")}
                      </span>
                      <span className="muted mt-1 block text-xs">
                        Updated {formatUpdated(trip.updatedAt) ?? "recently"}
                      </span>
                    </span>
                    <Icon name="arrow" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
