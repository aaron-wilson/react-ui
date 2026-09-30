FROM node:24-slim AS build
WORKDIR /app
RUN npm install -g pnpm@11.18.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
ARG UI_SITE_ORIGIN=http://localhost:3001
ARG NEXT_PUBLIC_SENTRY_DSN=
ARG NEXT_PUBLIC_SENTRY_RELEASE=
ENV NEXT_PUBLIC_GRAPHQL_URL=$NEXT_PUBLIC_GRAPHQL_URL UI_SITE_ORIGIN=$UI_SITE_ORIGIN NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN NEXT_PUBLIC_SENTRY_RELEASE=$NEXT_PUBLIC_SENTRY_RELEASE
RUN node scripts/build-images.mjs --check && pnpm build

FROM node:24-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001
WORKDIR /app
RUN useradd --system --uid 10001 wander
COPY --from=build --chown=wander:wander /app/out ./out
COPY --from=build --chown=wander:wander /app/scripts/serve-static.mjs ./scripts/serve-static.mjs
USER wander
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:3001/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "scripts/serve-static.mjs"]
