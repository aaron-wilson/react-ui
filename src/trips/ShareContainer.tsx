"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "urql";
import { SharedTrip } from "../graphql/operations";
import { dayCount, formatDay, formatRange } from "../lib/format";
import { decodeShareLink } from "./shareLink";
import { TripSkeleton } from "./TripSkeleton";

export function ShareContainer() {
  const share = decodeShareLink(useSearchParams().get("token"));
  const [{ data, fetching, error }] = useQuery({
    query: SharedTrip,
    variables: {
      ownerId: share?.ownerId ?? "",
      tripId: share?.tripId ?? "",
      token: share?.token ?? "",
    },
    pause: !share,
  });
  if (!share)
    return (
      <main className="py-20">
        <h1 className="display text-4xl md:text-5xl">Invalid share link</h1>
        <p className="muted mt-4 max-w-md">
          The link is incomplete. Ask its owner to send it again.
        </p>
        <Link className="primary mt-8" href="/">
          Go to Wander
        </Link>
      </main>
    );
  if (fetching && !data) return <TripSkeleton label="Loading shared trip" />;
  if (error || !data?.sharedTrip)
    return (
      <main className="py-20">
        <h1 className="display text-4xl md:text-5xl">This shared trip is unavailable</h1>
        <p role="alert" className="muted mt-4 max-w-md">
          The link may have expired or been revoked.
        </p>
        <Link className="primary mt-8" href="/">
          Go to Wander
        </Link>
      </main>
    );
  const trip = data.sharedTrip;
  const range = formatRange(trip.days.map((day) => day.date));
  return (
    <main className="pb-10">
      <p className="eyebrow mt-12">Shared journey</p>
      <h1 className="display mt-3 text-4xl md:text-5xl">{trip.city}</h1>
      <p className="muted mt-3">
        {[range, dayCount(trip.days.length)].filter(Boolean).join(" · ")}
        <span className="chip chip-quiet ml-2 align-middle">A read-only itinerary</span>
      </p>
      <div className="mt-8 grid gap-4">
        {trip.days.map((day, index) => (
          <article className="surface rounded-2xl p-6" key={day.id}>
            <p className="eyebrow">Day {index + 1}</p>
            <h2 className="display mt-1 text-2xl">{formatDay(day.date)}</h2>
            {day.activities.length === 0 && <p className="muted mt-4">Nothing planned yet.</p>}
            <ul className="mt-4 grid gap-3">
              {day.activities.map((activity) => (
                <li className="activity" key={activity.id}>
                  {activity.title}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="surface-flat mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6">
        <p className="muted">Planning a trip of your own?</p>
        <Link className="control" href="/plan/">
          Start planning
        </Link>
      </div>
    </main>
  );
}
