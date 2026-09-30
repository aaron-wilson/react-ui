import { HealthPanel } from "../src/components/HealthPanel";
import Link from "next/link";
import { WanderPicture } from "../src/components/WanderPicture";

export default function Home() {
  return (
    <main>
      <div className="grid gap-8 py-14 md:grid-cols-[1.4fr_1fr] md:items-end md:py-24">
        <div>
          <p className="eyebrow">A clearer way to explore</p>
          <h1 className="mt-5 max-w-2xl text-5xl font-semibold tracking-tight md:text-7xl">
            Make room for the unexpected.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed opacity-75">
            Sketch a city, shape your days, and keep the good discoveries close. Your next itinerary
            starts here.
          </p>
          <Link className="primary mt-8 inline-flex" href="/plan/">
            Start planning <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <WanderPicture />
      </div>
      <Link href="/docs/" className="underline">
        Explore how Wander works
      </Link>
      <div className="grid gap-5 pb-14 md:grid-cols-2">
        <HealthPanel />
        <section className="surface rounded-2xl p-6">
          <p className="eyebrow">Thoughtful by design</p>
          <h2 className="mt-2 text-xl font-semibold">A plan that moves with you</h2>
          <p className="mt-2 text-sm leading-relaxed opacity-75">
            Save ideas, pin favorites, and refine the rest whenever inspiration strikes.
          </p>
        </section>
      </div>
    </main>
  );
}
