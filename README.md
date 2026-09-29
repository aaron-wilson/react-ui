# Wander UI

Wander is a static Next.js App Router frontend for planning and sharing trips. Next handles development and builds; Vitest uses Vite only to test components. `output: "export"` writes the site to `out/`, so hosting needs no Next server, API routes, or server actions.

## Local setup

Use Node.js 20 or newer and pnpm 11.18.0. From this directory:

```sh
pnpm install
pnpm dev
```

The UI defaults to `http://localhost:4000/graphql` and checks the GraphQL `/health` endpoint. Run the sibling GraphQL and REST services to use planning features. Set `NEXT_PUBLIC_GRAPHQL_URL` to a public GraphQL endpoint ending in `/graphql` when needed. The only build setting, `UI_SITE_ORIGIN`, sets metadata; neither setting is a secret. `.env.example` lists both.

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

GraphQL operations use generated types from the checked-in `schema.graphql`. `schema:check` also compares the copied schema with a sibling `graph-api` checkout when present. The static `start` script serves the built `out/` directory locally. Browser packages are downloaded separately when end-to-end tests are added.
