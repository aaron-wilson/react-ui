import { Suspense } from "react";
import { TripSkeleton } from "../../src/trips/TripSkeleton";
import { ShareContainer } from "../../src/trips/ShareContainer";

export default function SharePage() {
  return (
    <Suspense fallback={<TripSkeleton label="Loading shared trip" />}>
      <ShareContainer />
    </Suspense>
  );
}
