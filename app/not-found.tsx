import Link from "next/link";

export default function NotFound() {
  return (
    <main className="py-20">
      <p className="eyebrow">Off the map</p>
      <h1 className="display mt-4 text-4xl md:text-5xl">This page does not exist.</h1>
      <p className="muted mt-4 max-w-md">
        The link may be old or mistyped. Your saved trips are still where you left them.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="primary" href="/plan/">
          Go to your trips
        </Link>
        <Link className="control" href="/">
          Back home
        </Link>
      </div>
    </main>
  );
}
