import { Suspense } from "react";
import { TripSkeleton } from "../../src/trips/TripSkeleton";
import { TripContainer } from "../../src/trips/TripContainer";

export default function TripPage() {
  return (
    <Suspense fallback={<TripSkeleton label="Loading your trip" />}>
      <TripContainer />
    </Suspense>
  );
}
