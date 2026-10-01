import PlanningJourney from "../../content/planning-journey.mdx";
import PlanningProviders from "../../content/planning-providers.mdx";
import { ProviderChoice } from "../../src/components/ProviderChoice";

export default function DocsPage() {
  return (
    <main className="max-w-3xl py-10">
      <p className="eyebrow">Guide</p>
      <h1 className="display mt-3 text-4xl md:text-5xl">How Wander works</h1>
      <div className="docs-content mt-8 space-y-5">
        <PlanningJourney />
      </div>
      <div className="docs-content mt-10 space-y-5">
        <PlanningProviders />
      </div>
      <div className="mt-8">
        <ProviderChoice />
      </div>
    </main>
  );
}
