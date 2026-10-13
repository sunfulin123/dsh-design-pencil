import { createReadStream } from 'node:fs'
import { realpath, stat } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { pipeline } from 'node:stream/promises'

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.op': 'application/json; charset=utf-8',
}

export async function serveStatic(request, response, { webRoot, canvaskitRoot }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname
  let root
  let name
  if ((pathname === '/' || pathname === '/index.html') && webRoot) {
    root = webRoot
    name = 'index.html'
  } else if (pathname.startsWith('/assets/') && webRoot) {
    root = webRoot
    name = `assets/${decodeURIComponent(pathname.slice('/assets/'.length))}`
  } else if (pathname.startsWith('/pkg/') && webRoot) {
    root = webRoot
    name = decodeURIComponent(pathname.slice('/pkg/'.length))
  } else if (pathname.startsWith('/canvaskit/') && canvaskitRoot) {
    root = canvaskitRoot
    name = decodeURIComponent(pathname.slice('/canvaskit/'.length))
  } else {
    return false
  }
  if (name.includes('\0') || name.includes('\\') || isAbsolute(name) || name.split('/').includes('..')) return false
  const mime = MIME_TYPES[extname(name).toLowerCase()]
  if (!mime) return false
  try {
    const canonicalRoot = await realpath(root)
    const path = await realpath(resolve(canonicalRoot, name))
    const inside = relative(canonicalRoot, path)
    if (isAbsolute(inside) || inside === '..' || inside.startsWith(`..${sep}`)) return false
    const file = await stat(path)
    if (!file.isFile()) return false
    response.writeHead(200, { 'content-type': mime, 'content-length': file.size, 'cache-control': 'no-store' })
    if (request.method === 'HEAD') response.end()
    else await pipeline(createReadStream(path), response)
    return true
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false
    throw error
  }
}