import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { contentTypeFor } from "./static-types.mjs";

const root = resolve("out");
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    const path = resolve(root, `.${pathname}`, pathname.endsWith("/") ? "index.html" : "");
    if (path !== root && !path.startsWith(`${root}${sep}`)) throw new Error("Invalid path");
    const file = (await stat(path)).isDirectory() ? resolve(path, "index.html") : path;
    response.writeHead(200, {
      "content-type": contentTypeFor(file),
      "cache-control": "no-store",
    });
    response.end(await readFile(file));
  } catch {
    const page = await readFile(resolve(root, "404.html")).catch(() => "Not found");
    response.writeHead(404, {
      "content-type":
        typeof page === "string" ? "text/plain; charset=utf-8" : contentTypeFor(".html"),
      "cache-control": "no-store",
    });
    response.end(page);
  }
}).listen(Number(process.env.PORT ?? 3001), process.env.HOST ?? "127.0.0.1");
// As the container's first process, Node ignores stop signals unless they are handled.
for (const signal of ["SIGTERM", "SIGINT"])
  process.once(signal, () => {
    server.close(() => process.exit(0));
    server.closeAllConnections();
  });
