# Wander UI

Wander is a React/Next.js App Router trip planner with typed urql operations and Tailwind controls. Next performs development and static builds; Vite transforms Vitest component tests. `output: "export"` writes `out/` with no Next server, API routes, SSR or Server Actions. MDX teaching pages are committed build-time snapshots; Sharp creates local responsive image variants with no image server.

## Local use

Use the Node 24 runtime baseline and pnpm 11.18.0 lockfile. Dependency setup is explicit: `pnpm install --frozen-lockfile`. With installed dependencies, start the sibling REST and GraphQL demo services, then run `pnpm dev`. Defaults are demo mode and `http://localhost:4000/graphql`. `UI_SITE_ORIGIN` sets static metadata. `NEXT_PUBLIC_*` values are public build inputs; source-map upload credentials in `.env.example` are build-only secrets and never browser configuration.

For a built preview:

```sh
NEXT_TELEMETRY_DISABLED=1 node_modules/.bin/next build --webpack
node scripts/serve-static.mjs
```

The preview serves `out/` at `http://localhost:3001`; `HOST` and `PORT` control only this listener. Configure the GraphQL URL before building. The browser talks to GraphQL, never directly to REST. Trips can be created, streamed, refined, pinned/swapped, saved and shared read-only.

## Authentication and reporting

Live mode requires a public Cognito app client without a secret, Authorization Code + PKCE, `openid`, and the exact static `/auth/callback/` URL. Set `NEXT_PUBLIC_APP_MODE=live` and the domain, client ID, issuer and callback fields in `.env.example`; configure both APIs for the same pool/client. Public sharing needs no sign-in.

The access token stays in memory. A one-time PKCE verifier/state/nonce stays in sessionStorage for at most ten minutes. Reload requires sign-in; sign-out clears token, pending transaction and identity-scoped urql cache. The callback removes its code from browser history. HTTP and SSE carry tokens in Authorization headers, never URLs. Generation replay lasts only within the graph process; restarts lose pending work.

Sentry reporting is disabled with a blank public DSN. The optional adapter scrubs private event data. Source-map generation and authenticated upload are explicit build-only operations; no upload occurs in default builds.

For the full container demo, use Compose in the [sibling hub](../graph-rest-react-stack/README.md). Compose runs all three applications instead of the source dev commands; stop the source servers first to free ports 3000, 4000 and 3001. A built host preview is also local and needs both APIs running.

## Checks and implementation status

With installed dependencies and the sibling hub platform toolchain:

```sh
node ../graph-rest-react-stack/scripts/verify-repo.mjs react-ui --e2e
```

Checks cover format/lint/types, Vitest UI/auth/monitoring behavior, generated operations/SDL/docs/images drift, static build and actual exported routes/assets, Chrome's real three-service journey, CDK assertions and credential-free synth. The Firefox/WebKit projects are opt-in and require existing Playwright browsers; checks never download them.

`infra/` implements private S3/CloudFront OAC hosting, static routes, cache rules and invalidation. `scripts/build-static.mjs` records revision and public configuration; `scripts/publish-static.mjs` defaults to dry-run and uploads only with explicit `--execute`. Cloud hosting, managed sign-in and Sentry exports remain live-unverified. Docker/Compose acceptance requires Docker. All GitHub workflow templates remain inactive. The sibling hub's learning and verification indexes record the exact local evidence and remaining prerequisites.

See the [learning index](../graph-rest-react-stack/docs/README.md), [verification record](../graph-rest-react-stack/docs/verification.md), and [deployment runbook](../graph-rest-react-stack/docs/patterns/deployment-runbook.md) for the shared toolchain and AWS environment flow. AWS hosting uses live Cognito auth even when planning providers are mock; `pnpm dev` means local source development.
