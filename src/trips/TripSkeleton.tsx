/** Placeholder with the itinerary's shape, shown while a trip loads. */
export function TripSkeleton({ label }: { label: string }) {
  return (
    <main className="pb-10">
      <p role="status" className="sr-only">
        {label}…
      </p>
      <div className="skeleton mt-12 h-4 w-28" />
      <div className="skeleton mt-4 h-11 w-64 max-w-full" />
      <div className="skeleton mt-4 h-4 w-48" />
      <div className="mt-8 grid gap-4">
        {[0, 1].map((item) => (
          <div key={item} className="surface rounded-2xl p-6">
            <div className="skeleton h-4 w-16" />
            <div className="skeleton mt-3 h-6 w-56 max-w-full" />
            <div className="skeleton mt-5 h-4 w-full" />
            <div className="skeleton mt-3 h-4 w-4/5" />
          </div>
        ))}
      </div>
    </main>
  );
}
