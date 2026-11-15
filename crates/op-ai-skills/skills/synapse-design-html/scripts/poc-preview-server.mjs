/** Local static review server; owns a random loopback port and no shared process. */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

export function startStaticServer(rootDir, entryFile) {
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
  };

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let reqPath;
      try {
        reqPath = decodeURIComponent((req.url || "/").split("?")[0]);
      } catch {
        res.writeHead(400).end("Bad request");
        return;
      }
      const relPath = reqPath === "/" ? entryFile : reqPath.replace(/^\/+/, "");
      const fullPath = path.resolve(rootDir, relPath);
      let realFile;
      try {
        realFile = fs.realpathSync(fullPath);
      } catch {
        res.writeHead(404).end("Not found");
        return;
      }
      const relative = path.relative(fs.realpathSync(rootDir), realFile);
      if (
        !relative ||
        relative === ".." ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative) ||
        fs.statSync(realFile).isDirectory()
      ) {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }
      const ext = path.extname(fullPath).toLowerCase();
      res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
      fs.createReadStream(realFile).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      resolve({ server, url: `http://127.0.0.1:${addr.port}/` });
    });
    server.on("error", reject);
  });
}
