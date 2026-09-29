import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "schema.graphql",
  documents: ["src/**/*.ts", "src/**/*.tsx"],
  ignoreNoDocuments: true,
  generates: {
    "src/gql/": { preset: "client", presetConfig: { gqlTagName: "graphql" } },
  },
};
export default config;
