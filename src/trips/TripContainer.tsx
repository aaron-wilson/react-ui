"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useClient, useQuery } from "urql";
import { useAuth } from "../auth/AuthProvider";
import { PinActivity, ShareTrip, SwapActivity, TripDetails } from "../graphql/operations";
import { encodeShareLink } from "./shareLink";
import { useGeneration } from "./useGeneration";

export function TripContainer() {
  const id = useSearchParams().get("id");
  const { identity, getToken, signIn } = useAuth();
  const client = useClient();
  const [{ data, fetching, error }, reload] = useQuery({
    query: TripDetails,
    variables: { id: id ?? "" },
    pause: !id || !identity,
  });
  const generation = useGeneration(getToken);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (generation.status === "completed") reload({ requestPolicy: "network-only" });
  }, [generation.status, reload]);
  if (!id)
    return (
      <main className="py-16">
        <h1 className="text-3xl font-semibold">Trip link is missing</h1>
        <Link className="primary mt-6 inline-flex" href="/plan/">
          Plan a trip
        </Link>
      </main>
    );
  if (!identity)
    return (
      <main className="py-16">
        <h1 className="text-3xl font-semibold">Sign in to view your trip</h1>
        <button className="primary mt-6" onClick={() => void signIn()}>
          Sign in
        </button>
      </main>
    );
  if (fetching && !data)
    return (
      <main className="py-16" role="status">
        Loading your trip…
      </main>
    );
  if (error)
    return (
      <main className="py-16">
        <h1 className="text-3xl font-semibold">Could not load this trip</h1>
        <p role="alert" className="error mt-4">
          {error.message}
        </p>
        <button className="control mt-4" onClick={() => reload({ requestPolicy: "network-only" })}>
          Retry
        </button>
      </main>
    );
  const trip = data?.trip;
  if (!trip)
    return (
      <main className="py-16">
        <h1 className="text-3xl font-semibold">Trip not found</h1>
        <Link className="primary mt-6 inline-flex" href="/plan/">
          Back to planning
        </Link>
      </main>
    );
  const mutate = async (work: () => Promise<{ error?: { message: string } }>) => {
    setBusy(true);
    setActionError(null);
    try {
      const result = await work();
      if (result.error) setActionError(result.error.message);
      else reload({ requestPolicy: "network-only" });
    } catch {
      setActionError("Could not save this change. Try again.");
    } finally {
      setBusy(false);
    }
  };
  const refine = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const interests = String(form.get("interests") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const pace = String(form.get("pace"));
    if (
      interests.some((item) => item.length > 80) ||
      interests.length > 20 ||
      !["RELAXED", "BALANCED", "BUSY"].includes(pace)
    ) {
      setActionError("Check the interests and pace before refining.");
      return;
    }
    await generation.startRefine({
      tripId: trip.id,
      version: trip.version,
      preferences: { interests, pace: pace as "RELAXED" | "BALANCED" | "BUSY" },
    });
  };
  const shareUrl = trip.share
    ? encodeShareLink("", { ownerId: trip.ownerId, tripId: trip.id, token: trip.share.token })
    : null;
  return (
    <main className="pb-16">
      <Link className="inline-block py-5 text-sm underline" href="/plan/">
        ← Saved trips
      </Link>
      <p className="eyebrow mt-4">Your itinerary</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{trip.city}</h1>
      <p className="mt-3 opacity-75">
        {trip.days.length} days · Version {trip.version}
      </p>
      {actionError && (
        <p role="alert" className="error mt-5">
          {actionError}
        </p>
      )}
      <div className="mt-8 grid gap-7 lg:grid-cols-[1.6fr_1fr]">
        <section aria-label="Day board" className="grid gap-4">
          {trip.days.length === 0 && <p>No days have been planned yet.</p>}
          {trip.days.map((day, index) => (
            <article className="surface rounded-2xl p-6" key={day.id}>
              <p className="eyebrow">Day {index + 1}</p>
              <h2 className="mt-1 text-xl font-semibold">{day.date}</h2>
              {day.activities.length === 0 && <p className="mt-4 opacity-75">No activities yet.</p>}
              <ul className="mt-4 grid gap-4">
                {day.activities.map((activity) => (
                  <li
                    className="border-t pt-4"
                    style={{ borderColor: "var(--line)" }}
                    key={activity.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">
                        {activity.title}{" "}
                        {activity.pinned && <span className="text-xs opacity-75">· Pinned</span>}
                      </p>
                      <button
                        disabled={busy || generation.status === "running"}
                        className="control text-sm"
                        onClick={() =>
                          void mutate(() =>
                            client
                              .mutation(PinActivity, {
                                input: {
                                  tripId: trip.id,
                                  version: trip.version,
                                  activityId: activity.id,
                                  pinned: !activity.pinned,
                                },
                              })
                              .toPromise()
                          )
                        }
                      >
                        {activity.pinned ? "Unpin" : "Pin"} {activity.title}
                      </button>
                    </div>
                    {!activity.pinned && (
                      <form
                        className="mt-3 flex flex-wrap gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const title = String(
                            new FormData(event.currentTarget).get("title") ?? ""
                          ).trim();
                          if (!title || title.length > 120) {
                            setActionError("Enter a replacement title under 120 characters.");
                            return;
                          }
                          void mutate(() =>
                            client
                              .mutation(SwapActivity, {
                                input: {
                                  tripId: trip.id,
                                  version: trip.version,
                                  activityId: activity.id,
                                  title,
                                },
                              })
                              .toPromise()
                          );
                        }}
                      >
                        <label className="field grow">
                          Replacement for {activity.title}
                          <input name="title" maxLength={120} required placeholder="A new idea" />
                        </label>
                        <button className="control self-end" type="submit" disabled={busy}>
                          Swap
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
        <aside className="grid content-start gap-5">
          <form className="surface grid gap-4 rounded-2xl p-6" onSubmit={refine} key={trip.version}>
            <p className="eyebrow">Make it yours</p>
            <h2 className="text-xl font-semibold">Refine the plan</h2>
            <label className="field">
              Interests
              <input name="interests" defaultValue={trip.preferences.interests.join(", ")} />
            </label>
            <label className="field">
              Pace
              <select name="pace" defaultValue={trip.preferences.pace}>
                <option value="RELAXED">Relaxed</option>
                <option value="BALANCED">Balanced</option>
                <option value="BUSY">Busy</option>
              </select>
            </label>
            <button className="primary" disabled={generation.status === "running"} type="submit">
              {generation.status === "running" ? "Refining…" : "Refine itinerary"}
            </button>
            <div aria-live="polite">
              {generation.status !== "idle" && <p>Status: {generation.status}</p>}
              {generation.text && <p className="mt-2 whitespace-pre-wrap">{generation.text}</p>}
              {generation.error && (
                <p className="error mt-2" role="alert">
                  {generation.error}
                </p>
              )}
            </div>
            {generation.status === "interrupted" && (
              <button className="control" type="button" onClick={generation.reconnect}>
                Reconnect
              </button>
            )}
          </form>
          <section className="surface rounded-2xl p-6">
            <p className="eyebrow">Share the journey</p>
            <h2 className="mt-2 text-xl font-semibold">Invite someone along</h2>
            <button
              className="control mt-4"
              disabled={busy}
              type="button"
              onClick={() =>
                void mutate(() =>
                  client
                    .mutation(ShareTrip, { input: { tripId: trip.id, version: trip.version } })
                    .toPromise()
                )
              }
            >
              Create share link
            </button>
            {shareUrl && (
              <p className="mt-4 break-all text-sm">
                Public link:{" "}
                <Link className="underline" href={shareUrl}>
                  {shareUrl}
                </Link>
              </p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
