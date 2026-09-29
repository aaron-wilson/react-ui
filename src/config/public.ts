export function parsePublicConfig(input: { NEXT_PUBLIC_GRAPHQL_URL?: string }) {
  const value = input.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql";
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.endsWith("/graphql")
  )
    throw new Error("Invalid NEXT_PUBLIC_GRAPHQL_URL");
  return Object.freeze({ graphqlUrl: url.toString() });
}

export const publicConfig = parsePublicConfig({
  NEXT_PUBLIC_GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL,
});
