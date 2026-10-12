#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const options = {}
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index]
  const value = process.argv[index + 1]
  if (!['--openpencil-root', '--out-dir', '--esbuild'].includes(key) || !value) {
    throw new Error(`Invalid viewer build argument: ${key}`)
  }
  options[key] = value
}
const checkout = resolve(options['--openpencil-root'] ?? projectRoot)
const destination = resolve(options['--out-dir'] ?? join(projectRoot, 'dist', 'viewer-assets'))
const relativeDestination = relative(projectRoot, destination)
if (!relativeDestination || relativeDestination === '..' || relativeDestination.startsWith(`..${sep}`) || isAbsolute(relativeDestination)) {
  throw new Error('Viewer output must be inside the fork workspace')
}
const esbuild = resolve(options['--esbuild'] ?? join(projectRoot, 'packages', 'dsh-runtime-build', 'node_modules', '.bin', 'esbuild'))
const temporary = `${destination}.build-${randomUUID()}`
const required = ['sdk.js', 'op_web_sdk_bg.wasm', 'canvaskit/canvaskit.js', 'canvaskit/canvaskit.wasm']

async function replaceRequired(path, marker, replacement) {
  const text = await readFile(path, 'utf8')
  if (!text.includes(marker)) throw new Error(`Viewer build input changed: ${path}`)
  await writeFile(path, text.replace(marker, replacement))
}

await mkdir(temporary, { recursive: true })
try {
  const sources = join(temporary, '.sdk-build')
  await cp(join(checkout, 'packages', 'op-web-sdk', 'src'), join(sources, 'src'), { recursive: true })
  await cp(join(checkout, 'crates', 'op-web-sdk', 'pkg'), join(sources, 'wasm'), { recursive: true })
  await replaceRequired(join(sources, 'src', 'wasm.ts'), "'virtual:op_web_sdk_wasm'", "'../wasm/op_web_sdk.js'")
  await replaceRequired(join(sources, 'src', 'types.ts'), '  wasmUrl?: string;', '  wasmUrl?: string;\n  canvasKitBaseUrl?: string;')
  await replaceRequired(join(sources, 'src', 'viewer.ts'),
    'export async function createViewer(opts: CreateViewerOptions): Promise<OpViewer> {\n  await ensureWasm(opts.wasmUrl);',
    [
      'export async function createViewer(opts: CreateViewerOptions): Promise<OpViewer> {',
      '  if (opts.canvasKitBaseUrl !== undefined) {',
      "    if (!/^\\/?[^?#]*\\/$/.test(opts.canvasKitBaseUrl)) throw new Error('op-web-sdk: canvasKitBaseUrl must end with /');",
      '    globalThis.__OPENPENCIL_CANVASKIT_BASE_URL__ = opts.canvasKitBaseUrl;',
      '  }',
      '  await ensureWasm(opts.wasmUrl);',
    ].join('\n'))
  await writeFile(join(sources, 'src', 'dsh-viewer-assets.d.ts'),
    'export {};\ndeclare global { var __OPENPENCIL_CANVASKIT_BASE_URL__: string | undefined; }\n')

  const entry = await readFile(join(sources, 'wasm', 'op_web_sdk.js'), 'utf8')
  const bridgeImport = /from ['"]\.\/snippets\/([^/'"]+)\/src\/op_ck_bridge\.js['"]/.exec(entry)
  if (!bridgeImport) throw new Error('Viewer wasm-bindgen bridge import changed')
  const bridge = join(sources, 'wasm', 'snippets', bridgeImport[1], 'src', 'op_ck_bridge.js')
  await replaceRequired(bridge, 'function copyBytes(u8) {', [
    'function openPencilCanvasKitAsset(filename) {',
    '  const configured = globalThis.__OPENPENCIL_CANVASKIT_BASE_URL__;',
    "  const base = typeof configured === 'string' && configured.length > 0 ? configured : '/canvaskit/';",
    '  return new URL(filename, new URL(base, globalThis.location.href)).href;',
    '}',
    '',
    'function copyBytes(u8) {',
  ].join('\n'))
  await replaceRequired(bridge, "  await loadScript('/canvaskit/canvaskit.js');", "  await loadScript(openPencilCanvasKitAsset('canvaskit.js'));")
  await replaceRequired(bridge, "  const CK = await CanvasKitInit({ locateFile: (f) => '/canvaskit/' + f });",
    '  const CK = await CanvasKitInit({ locateFile: (filename) => openPencilCanvasKitAsset(filename) });')
  execFileSync(esbuild, [join(sources, 'src', 'index.ts'), '--bundle', '--format=esm', '--platform=browser', '--target=es2022',
    '--minify-whitespace', `--outfile=${join(temporary, 'sdk.js')}`, '--log-level=warning'], { stdio: 'inherit' })
  const wasmRoot = join(checkout, 'crates', 'op-web-sdk', 'pkg')
  const rawWasm = join(wasmRoot, 'op_web_sdk_bg.wasm')
  const optimizedWasm = join(wasmRoot, 'op_web_sdk_bg.opt.wasm')
  const rawInfo = await stat(rawWasm)
  const optimizedInfo = await stat(optimizedWasm).catch(error => {
    if (error.code === 'ENOENT') return undefined
    throw error
  })
  await cp(optimizedInfo && optimizedInfo.mtimeMs >= rawInfo.mtimeMs ? optimizedWasm : rawWasm,
    join(temporary, 'op_web_sdk_bg.wasm'))
  await mkdir(join(temporary, 'canvaskit'))
  for (const filename of ['canvaskit.js', 'canvaskit.wasm']) {
    await cp(join(checkout, 'crates', 'op-host-web', 'assets', 'canvaskit', filename), join(temporary, 'canvaskit', filename))
  }
  await rm(sources, { recursive: true, force: true })
  const sdk = await readFile(join(temporary, 'sdk.js'), 'utf8')
  if (!sdk.includes('__OPENPENCIL_CANVASKIT_BASE_URL__') || !sdk.includes('openPencilCanvasKitAsset("canvaskit.js")')) {
    throw new Error('Viewer bundle lost the CanvasKit namespace')
  }
  const wasm = await WebAssembly.compile(await readFile(join(temporary, 'op_web_sdk_bg.wasm')))
  if (WebAssembly.Module.imports(wasm).some(entry => entry.module === 'env')) {
    throw new Error('Viewer bundle has unsupported env imports')
  }
  const files = {}
  for (const name of required) {
    const bytes = await readFile(join(temporary, name))
    files[name] = { bytes: bytes.byteLength, sha256: createHash('sha256').update(bytes).digest('hex') }
  }
  const revisionInput = required.map(name => `${name}\0${files[name].bytes}\0${files[name].sha256}`).join('\n')
  const revision = createHash('sha256').update(revisionInput).digest('hex').slice(0, 20)
  await writeFile(join(temporary, 'manifest.json'), `${JSON.stringify({ version: 1, revision, files }, null, 2)}\n`)
  await mkdir(destination, { recursive: true })
  for (const name of [...required, 'manifest.json']) {
    await mkdir(dirname(join(destination, name)), { recursive: true })
    await cp(join(temporary, name), join(destination, name))
  }
  console.log(`Viewer staged: ${destination} revision=${revision}`)
} finally {
  await rm(temporary, { recursive: true, force: true })
}