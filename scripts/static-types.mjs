// Content types for the exported site. Next fetches `.txt` navigation payloads and falls back to
// a full page load unless they arrive as text/plain, so an unknown type must never cover them.
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
};

export function contentTypeFor(file) {
  const dot = file.lastIndexOf(".");
  const extension = dot < 0 ? "" : file.slice(dot).toLowerCase();
  return contentTypes[extension] ?? "application/octet-stream";
}
