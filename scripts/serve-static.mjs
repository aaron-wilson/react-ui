import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";

const root = resolve("out");
const contentTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    const path = resolve(root, `.${pathname}`, pathname.endsWith("/") ? "index.html" : "");
    if (path !== root && !path.startsWith(`${root}${sep}`)) throw new Error("Invalid path");
    const file = (await stat(path)).isDirectory() ? resolve(path, "index.html") : path;
    const ext = file.slice(file.lastIndexOf("."));
    response.writeHead(200, {
      "content-type": contentTypes[ext] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(Number(process.env.PORT ?? 3001), "127.0.0.1");
