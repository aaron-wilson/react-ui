import { Suspense } from "react";
import { TripContainer } from "../../src/trips/TripContainer";

export default function TripPage() {
  return (
    <Suspense fallback={<main role="status">Loading trip…</main>}>
      <TripContainer />
    </Suspense>
  );
}
