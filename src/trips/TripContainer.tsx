"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useClient, useQuery, type CombinedError } from "urql";
import { useAuth } from "../auth/AuthProvider";
import { Icon } from "../components/Icon";
import { PaceField } from "../components/PaceField";
import { errorCode, friendlyError } from "../graphql/errors";
import { PinActivity, ShareTrip, SwapActivity, TripDetails } from "../graphql/operations";
import {
  dayCount,
  formatDay,
  formatRange,
  formatShortDate,
  formatUpdated,
  paceLabel,
  paces,
  type PaceValue,
} from "../lib/format";
import { GenerationNotes } from "./GenerationNotes";
import { encodeShareLink } from "./shareLink";
import { TripSkeleton } from "./TripSkeleton";
import { useGeneration } from "./useGeneration";

interface Activity {
  id: string;
  title: string;
  pinned: boolean;
}

function ActivityRow({
  activity,
  disabled,
  onPin,
  onSwap,
}: {
  activity: Activity;
  disabled: boolean;
  onPin: () => void;
  onSwap: (title: string) => string | null;
}) {
  const [swapping, setSwapping] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = String(new FormData(event.currentTarget).get("title") ?? "").trim();
    setProblem(onSwap(title));
  };
  return (
    <li className="activity">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <p className="min-w-0 flex-1 basis-56 font-medium">
          {activity.title}
          {activity.pinned && <span className="chip ml-2 align-middle">Pinned</span>}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="control btn-sm"
            disabled={disabled}
            aria-label={`${activity.pinned ? "Unpin" : "Pin"} ${activity.title}`}
            onClick={onPin}
          >
            <Icon name="pin" size={16} />
            {activity.pinned ? "Unpin" : "Pin"}
          </button>
          {!activity.pinned && (
            <button
              type="button"
              className="control btn-sm"
              disabled={disabled}
              aria-expanded={swapping}
              aria-label={`Swap ${activity.title}`}
              onClick={() => {
                setSwapping((open) => !open);
                setProblem(null);
              }}
            >
              <Icon name="swap" size={16} />
              Swap
            </button>
          )}
        </div>
      </div>
      {swapping && !activity.pinned && (
        <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={submit} noValidate>
          <label className="field min-w-0 flex-1 basis-56">
            Replacement for {activity.title}
            <input name="title" maxLength={120} autoFocus placeholder="A new idea" />
          </label>
          <button className="primary btn-sm" type="submit" disabled={disabled}>
            Replace
          </button>
          <button className="control btn-sm" type="button" onClick={() => setSwapping(false)}>
            Cancel
          </button>
          {problem && (
            <p role="alert" className="error basis-full text-sm">
              {problem}
            </p>
          )}
        </form>
      )}
    </li>
  );
}

function ShareLink({ path, expiresAt }: { path: string; expiresAt: string }) {
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const absolute = `${window.location.origin}${path}`;
  const copy = () => {
    navigator.clipboard
      .writeText(absolute)
      .then(() => setCopied("copied"))
      .catch(() => setCopied("failed"));
  };
  const expires = formatShortDate(expiresAt);
  return (
    <div className="mt-4 grid gap-3">
      <p className="break-all text-sm">
        <span className="muted">Public link: </span>
        <Link className="link" href={path}>
          {absolute}
        </Link>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button className="control btn-sm" type="button" onClick={copy}>
          <Icon name={copied === "copied" ? "check" : "copy"} size={16} />
          {copied === "copied" ? "Copied" : "Copy link"}
        </button>
        {expires && <span className="muted text-xs">Read-only. Expires {expires}.</span>}
      </div>
      <p aria-live="polite" className="muted text-xs">
        {copied === "failed" && "Copying is blocked here. Select the link and copy it instead."}
      </p>
    </div>
  );
}

function Message({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="py-20">
      <h1 className="display text-4xl md:text-5xl">{title}</h1>
      {body && <p className="muted mt-4 max-w-md">{body}</p>}
      <div className="mt-8 flex flex-wrap gap-3">{children}</div>
    </main>
  );
}

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
      <Message title="Trip link is missing" body="Open a trip from your saved list.">
        <Link className="primary" href="/plan/">
          Go to your trips
        </Link>
      </Message>
    );
  if (!identity)
    return (
      <Message title="Sign in to view your trip">
        <button className="primary" onClick={() => void signIn()}>
          Sign in
        </button>
      </Message>
    );
  if (fetching && !data) return <TripSkeleton label="Loading your trip" />;
  if (error && !data)
    return (
      <Message
        title="Could not load this trip"
        body={friendlyError(error, "Something went wrong on our side. Try again in a moment.")}
      >
        <button className="primary" onClick={() => reload({ requestPolicy: "network-only" })}>
          Try again
        </button>
        <Link className="control" href="/plan/">
          Back to your trips
        </Link>
      </Message>
    );
  const trip = data?.trip;
  if (!trip)
    return (
      <Message title="Trip not found" body="It may have been deleted, or the link is incomplete.">
        <Link className="primary" href="/plan/">
          Back to your trips
        </Link>
      </Message>
    );
  const mutate = async (work: () => Promise<{ error?: CombinedError }>) => {
    setBusy(true);
    setActionError(null);
    try {
      const result = await work();
      if (result.error) {
        setActionError(friendlyError(result.error, "Could not save this change. Try again."));
        // A conflict means the stored trip moved on; load it so the next attempt can succeed.
        if (errorCode(result.error) === "CONFLICT") reload({ requestPolicy: "network-only" });
      } else reload({ requestPolicy: "network-only" });
    } catch {
      setActionError("Could not save this change. Try again.");
    } finally {
      setBusy(false);
    }
  };
  const refining = generation.status === "running";
  const refine = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const interests = String(form.get("interests") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const pace = paces.find((option) => option.value === form.get("pace"))?.value;
    if (interests.some((item) => item.length > 80) || interests.length > 20 || !pace) {
      setActionError("Use up to 20 interests of 80 characters or fewer, and choose a pace.");
      return;
    }
    setActionError(null);
    await generation.startRefine({
      tripId: trip.id,
      version: trip.version,
      preferences: { interests, pace },
    });
  };
  const sharePath = trip.share
    ? encodeShareLink("", { ownerId: trip.ownerId, tripId: trip.id, token: trip.share.token })
    : null;
  const range = formatRange(trip.days.map((day) => day.date));
  const updated = formatUpdated(trip.updatedAt);
  return (
    <main className="pb-10">
      <Link
        className="muted mt-6 inline-flex items-center gap-2 text-sm hover:underline"
        href="/plan/"
      >
        <Icon name="back" size={16} />
        Saved trips
      </Link>
      <p className="eyebrow mt-6">Your itinerary</p>
      <h1 className="display mt-2 text-4xl md:text-5xl">{trip.city}</h1>
      <p className="muted mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        {[range, dayCount(trip.days.length), `${paceLabel(trip.preferences.pace)} pace`]
          .filter(Boolean)
          .join(" · ")}
        {updated && <span className="chip chip-quiet">Saved {updated}</span>}
      </p>
      {actionError && (
        <p role="alert" className="notice error mt-5 text-sm">
          {actionError}
        </p>
      )}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section aria-label="Day board" className="grid content-start gap-4">
          {trip.days.length === 0 && (
            <p className="surface-flat muted rounded-2xl p-6">No days have been planned yet.</p>
          )}
          {trip.days.map((day, index) => (
            <article className="surface rounded-2xl p-6" key={day.id}>
              <p className="eyebrow">Day {index + 1}</p>
              <h2 className="display mt-1 text-2xl">{formatDay(day.date)}</h2>
              {day.activities.length === 0 && <p className="muted mt-4">No activities yet.</p>}
              <ul className="mt-4 grid gap-4">
                {day.activities.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    disabled={busy || refining}
                    onPin={() =>
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
                    onSwap={(title) => {
                      if (!title || title.length > 120)
                        return "Enter a replacement of 120 characters or fewer.";
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
                      return null;
                    }}
                  />
                ))}
              </ul>
            </article>
          ))}
        </section>
        <aside className="grid content-start gap-5">
          <form className="surface grid gap-4 rounded-2xl p-6" onSubmit={refine} key={trip.version}>
            <p className="eyebrow">Make it yours</p>
            <h2 className="display text-2xl">Refine the plan</h2>
            <p className="muted text-sm">Pinned activities stay. Everything else is replanned.</p>
            <label className="field">
              Interests
              <input name="interests" defaultValue={trip.preferences.interests.join(", ")} />
            </label>
            <PaceField defaultValue={trip.preferences.pace as PaceValue} />
            <button className="primary" disabled={refining || busy} type="submit">
              {refining && <span className="spinner" aria-hidden="true" />}
              {refining ? "Refining…" : "Refine itinerary"}
            </button>
            <GenerationNotes
              generation={generation}
              running="Replanning the unpinned activities…"
              completed="Itinerary updated."
            />
          </form>
          <section className="surface rounded-2xl p-6" aria-labelledby="share-heading">
            <p className="eyebrow">Share the journey</p>
            <h2 id="share-heading" className="display mt-2 text-2xl">
              Invite someone along
            </h2>
            <p className="muted mt-2 text-sm">
              Anyone with the link can read this itinerary. They cannot change it.
            </p>
            <button
              className="control mt-4"
              disabled={busy || refining}
              type="button"
              onClick={() =>
                void mutate(() =>
                  client
                    .mutation(ShareTrip, { input: { tripId: trip.id, version: trip.version } })
                    .toPromise()
                )
              }
            >
              {trip.share ? "Create a new link" : "Create share link"}
            </button>
            {sharePath && trip.share && (
              <ShareLink path={sharePath} expiresAt={trip.share.expiresAt} />
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
