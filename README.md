# Wander UI

Wander is a static Next.js App Router frontend for planning and sharing trips. Next handles development and builds; Vitest uses Vite only to test components. `output: "export"` writes the site to `out/`, so hosting needs no Next server, API routes, or server actions.

## Local setup

Use Node.js 20 or newer and pnpm 11.18.0. From this directory:

```sh
pnpm install
pnpm dev
```

The UI defaults to demo mode and `http://localhost:4000/graphql`. Run the sibling GraphQL and REST services in demo mode to plan trips. Set `NEXT_PUBLIC_GRAPHQL_URL` to a public GraphQL endpoint ending in `/graphql` when needed. `UI_SITE_ORIGIN` sets static metadata. All values in `.env.example` are public build settings.

For Cognito, create a public app client with no client secret and enable Authorization Code grant, PKCE, and the `openid` scope. Register the exact static callback URL, for example `https://wander.example/auth/callback/`. Build with `NEXT_PUBLIC_APP_MODE=live`, `NEXT_PUBLIC_COGNITO_DOMAIN` (the HTTPS managed-login origin), `NEXT_PUBLIC_COGNITO_CLIENT_ID`, `NEXT_PUBLIC_COGNITO_ISSUER` (the user-pool issuer), and `NEXT_PUBLIC_AUTH_REDIRECT_URI`. The callback must match the deployed site's origin and `/auth/callback/` path. Configure GraphQL and REST in live mode with the matching user pool and app client; the APIs verify access tokens and trip ownership.

Sign-in uses Authorization Code + PKCE. The browser keeps the access token only in memory and keeps the one-time verifier, state, and nonce in `sessionStorage` for at most ten minutes. Signing out clears the token, pending transaction, and identity-scoped GraphQL cache. Reloading the page requires signing in again. The callback removes the authorization code from browser history before exchanging it. GraphQL HTTP and itinerary SSE send the access token in an Authorization header, never in a URL. Public shared trips remain readable without signing in.

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm codegen:check
pnpm schema:check
pnpm build
pnpm start
```

GraphQL operations use generated types from the checked-in `schema.graphql`. `schema:check` also compares the copied schema with a sibling `graph-api` checkout when present. The static `start` script serves the built `out/` directory locally. The Chromium end-to-end project uses an installed Chrome browser. Firefox and WebKit projects require their Playwright browsers to be installed separately.
