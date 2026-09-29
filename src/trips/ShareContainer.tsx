"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "urql";
import { SharedTrip } from "../graphql/operations";
import { decodeShareLink } from "./shareLink";

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
      <main className="py-16">
        <h1 className="text-3xl font-semibold">Invalid share link</h1>
        <Link className="inline-block pt-4 underline" href="/">
          Home
        </Link>
      </main>
    );
  if (fetching && !data)
    return (
      <main className="py-16" role="status">
        Loading shared trip…
      </main>
    );
  if (error || !data?.sharedTrip)
    return (
      <main className="py-16">
        <h1 className="text-3xl font-semibold">This shared trip is unavailable</h1>
        <p role="alert" className="mt-4">
          The link may have expired or been revoked.
        </p>
      </main>
    );
  const trip = data.sharedTrip;
  return (
    <main className="pb-16">
      <p className="eyebrow mt-12">Shared journey</p>
      <h1 className="mt-3 text-4xl font-semibold">{trip.city}</h1>
      <p className="mt-3 opacity-75">A read-only itinerary</p>
      <div className="mt-8 grid gap-4">
        {trip.days.map((day, index) => (
          <article className="surface rounded-2xl p-6" key={day.id}>
            <p className="eyebrow">Day {index + 1}</p>
            <h2 className="mt-1 text-xl font-semibold">{day.date}</h2>
            <ul className="mt-4 grid gap-2">
              {day.activities.map((activity) => (
                <li key={activity.id}>{activity.title}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </main>
  );
}
