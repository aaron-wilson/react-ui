# react-ui

> Static React/Next.js frontend with typed GraphQL, Tailwind, MDX, and browser tests.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Observability](#observability)
- [Optional Features](#optional-features)

---

## Overview

The frontend demonstrates a typed planning journey across real GraphQL and REST services. It combines streamed feedback, editable day boards, saved trips, public sharing and accessible controls.

- React/Next App Router exported to static files
- Generated urql operations and authenticated SSE
- Cognito PKCE, MDX examples and local responsive images

---

## Tech Stack

| Layer                   | Technology                                  | Role                                              |
| ----------------------- | ------------------------------------------- | ------------------------------------------------- |
| Language / runtime      | TypeScript 5.9.2 · Node 24                  | Strict types and build/runtime baseline           |
| Package management      | pnpm 11.18.0                                | Locked independent install                        |
| Framework               | Next 16.3.7 · React 19.3.0                  | Development server and static App Router export   |
| API client / validation | urql 5.0.4 · Zod 4.4.3                      | Generated operations and boundary checks          |
| Styling                 | Tailwind 4.3.3                              | Responsive controls and theme tokens              |
| Component tests         | Vite 8.3.1 · Vitest 5.0.2 · Testing Library | Vite transforms tests; Next builds the app        |
| Browser tests           | Playwright 1.63.0 · axe 4.13                | Real three-service journey and accessibility      |
| Content / images        | MDX 3.1.1 · Sharp 0.34.4                    | Small committed MDX examples and AVIF/WebP assets |
| Deployment              | CDK · private S3 · CloudFront OAC           | Static hosting, routing and cache policies        |
| Observability           | Sentry React 11.1.0                         | Optional scrubbed errors and performance          |

---

## Getting Started

Use Node 24 and pnpm 11.18.0. Start REST and GraphQL in their sibling directories first.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3001/. For the exported artifact, stop the UI dev server and run `pnpm build` then `pnpm start`; both APIs must stay running. Full-stack [hub Compose](https://github.com/aaron-wilson/graph-rest-react-stack) is an alternative to these host servers.

---

## Configuration

[.env.example](.env.example) lists public build inputs and build-only upload credentials. `NEXT_PUBLIC_GRAPHQL_URL` defaults to http://localhost:4000/graphql. Browser settings are compiled at build time.

Live auth uses a public Cognito client, authorization code + PKCE, and the exact `/auth/callback/` redirect. Tokens stay in memory; reload requires sign-in and sign-out clears the identity cache. Public shares need no login.

---

## Testing

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm codegen:check
pnpm schema:check
pnpm docs:check
pnpm images:check
pnpm build
pnpm test:static
pnpm test:e2e
```

E2E owns all three local servers and uses installed Chrome. `test:e2e:all` adds Firefox/WebKit when their browsers are installed. Infrastructure checks use the sibling hub's platform toolchain.

---

## CI/CD

Disabled workflow templates provide checks and manual OIDC deployment. `infra/` defines S3/CloudFront; `build:static` records artifact identity and `deploy:static` defaults to dry-run. Publication retains hashed assets and uploads HTML last. Cloud delivery and hosted login remain live-unverified.

---

## Observability

A blank `NEXT_PUBLIC_SENTRY_DSN` disables reporting. Opt-in builds scrub private context. `sentry:upload` explicitly uploads source maps with build-only credentials and removes them after success; no upload occurs in normal builds.

---

## Optional Features

- **MDX:** compact committed examples rendered at `/docs/` with a local interactive component.
- **Sharp:** generated 640/1280 AVIF and WebP images with drift checks.
- **Static delivery:** no Next server, SSR, Server Actions or runtime image service.
