import { readFileSync, realpathSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, isAbsolute, relative, resolve } from 'node:path';

function guessMimeForPath(filePath) {
  switch (extname(filePath).toLowerCase()) {
    case '.html':
    case '.htm':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
    case '.mjs':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.woff2':
      return 'font/woff2';
    case '.woff':
      return 'font/woff';
    case '.ttf':
      return 'font/ttf';
    default:
      return 'application/octet-stream';
  }
}

export async function startLocalHtmlServer(htmlBytes, baseDir) {
  let rootReal = null;
  if (baseDir) {
    try {
      rootReal = realpathSync(baseDir);
    } catch {
      rootReal = null;
    }
  }
  const server = createServer((req, res) => {
    const rawUrl = (req.url || '/').split(/[?#]/)[0] || '/';
    if (rawUrl === '/' || rawUrl === '/__op_entry__.html') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(htmlBytes);
      return;
    }
    if (!rootReal) {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      const decoded = decodeURIComponent(rawUrl.replace(/^\/+/, ''));
      if (!decoded || decoded.includes('\0') || isAbsolute(decoded)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const candidate = realpathSync(resolve(rootReal, decoded));
      const rel = relative(rootReal, candidate);
      if (!rel || rel.startsWith('..') || isAbsolute(rel)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const bytes = readFileSync(candidate);
      res.writeHead(200, {
        'Content-Type': guessMimeForPath(candidate),
        'Cache-Control': 'no-store',
      });
      res.end(bytes);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const addr = server.address();
  return {
    url: `http://127.0.0.1:${addr.port}/__op_entry__.html`,
    close: () => new Promise((r) => server.close(() => r())),
  };
}
