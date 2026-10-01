import Link from "next/link";
import { Icon } from "../src/components/Icon";
import { WanderPicture } from "../src/components/WanderPicture";

const steps = [
  {
    title: "Sketch",
    body: "Name a city, a start date and what you love. A first itinerary takes shape as you watch.",
  },
  {
    title: "Shape",
    body: "Pin the parts worth keeping, swap the ones that are not, and refine the rest.",
  },
  {
    title: "Share",
    body: "Send a read-only link to the people coming along. Revoke it whenever you like.",
  },
];

export default function Home() {
  return (
    <main>
      <div className="grid gap-10 py-12 md:grid-cols-[1.2fr_1fr] md:items-center md:py-20">
        <div>
          <p className="eyebrow">Trip planning, unhurried</p>
          <h1 className="display mt-5 max-w-2xl text-5xl md:text-7xl">
            Make room for the unexpected.
          </h1>
          <p className="muted mt-6 max-w-xl text-lg leading-relaxed">
            Sketch a city, shape your days, and keep the good discoveries close. Your next itinerary
            starts here.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="primary" href="/plan/">
              Start planning <Icon name="arrow" />
            </Link>
            <Link className="control" href="/docs/">
              How Wander works
            </Link>
          </div>
        </div>
        <WanderPicture />
      </div>
      <section aria-labelledby="steps-heading" className="pb-10">
        <h2 id="steps-heading" className="eyebrow">
          Three steps
        </h2>
        <ol className="mt-4 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="surface rounded-2xl p-6">
              <span className="step-number" aria-hidden="true">
                {index + 1}
              </span>
              <h3 className="display mt-4 text-2xl">{step.title}</h3>
              <p className="muted mt-2 text-sm leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
