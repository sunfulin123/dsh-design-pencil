import { readFile, realpath } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { startNodeHost } from './node-host.mjs'

async function main() {
  const { values } = parseArgs({
    options: {
      'serve-web': { type: 'boolean' },
      managed: { type: 'boolean' },
      port: { type: 'string', default: '0' },
      file: { type: 'string' },
      'allow-origin': { type: 'string', multiple: true, default: [] },
    },
  })
  if (!values['serve-web'] || !values.managed || !values.file || values.port !== '0') {
    throw new Error('Expected --serve-web --managed --port 0 --file <document>')
  }
  let host
  let stopping = false
  const stop = async () => {
    stopping = true
    process.stdin.pause()
    await host?.close()
  }
  process.stdin.once('end', stop)
  process.stdin.once('error', stop)
  process.stdout.once('error', stop)
  process.once('SIGTERM', stop)
  process.once('SIGINT', stop)
  process.stdin.resume()
  const sourcePath = await realpath(values.file)
  const document = JSON.parse(await readFile(sourcePath, 'utf8'))
  const runtimeRoot = dirname(fileURLToPath(import.meta.url))
  const webRoot = process.env.OPENPENCIL_WEB_BUNDLE_DIR || join(runtimeRoot, 'web-bundle')
  const canvaskitRoot = process.env.OPENPENCIL_CANVASKIT_DIR || join(webRoot, 'canvaskit')
  host = await startNodeHost({ document, sourcePath, allowOrigins: values['allow-origin'], webRoot, canvaskitRoot, onShutdown: stop })
  if (stopping) return host.close()
  process.stdout.write(`${JSON.stringify({
    ok: true,
    port: Number(new URL(host.baseUrl).port),
    token: host.token,
    version: 0,
  })}\n`)
}

main().catch(error => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
  process.stdin.pause()
})