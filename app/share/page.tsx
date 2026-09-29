import { Suspense } from "react";
import { ShareContainer } from "../../src/trips/ShareContainer";

export default function SharePage() {
  return (
    <Suspense fallback={<main role="status">Loading shared trip…</main>}>
      <ShareContainer />
    </Suspense>
  );
}
