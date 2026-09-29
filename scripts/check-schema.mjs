import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";

const local = readFileSync("schema.graphql");
const actual = createHash("sha256").update(local).digest("hex");
const pinned = readFileSync("schema.sha256", "utf8").trim();
if (actual !== pinned) throw new Error("Copied GraphQL schema differs from its pinned hash");
const sibling = "../graph-api/schema.graphql";
if (existsSync(sibling) && !local.equals(readFileSync(sibling)))
  throw new Error("Copied GraphQL schema differs from sibling graph-api");
