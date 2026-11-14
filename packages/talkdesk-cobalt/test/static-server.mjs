/** Serve only the disposable built documentation root on an ephemeral loopback port. */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep, join } from "node:path";
export async function serveStatic(root) {
  const server = createServer(async (req, res) => {
    try {
      const path = resolve(
        root,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
      if (path !== root && !path.startsWith(root + sep)) throw new Error("Outside root");
      const file = (await stat(path)).isDirectory() ? join(path, "index.html") : path;
      const data = await readFile(file);
      res.setHeader(
        "content-type",
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".json": "application/json",
          ".png": "image/png",
          ".svg": "image/svg+xml",
        }[extname(file)] ?? "application/octet-stream",
      );
      res.end(data);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
