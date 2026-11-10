import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { indexRuntimePayload } from './dsh-runtime-payload.mjs'

async function skillFiles(directory, prefix = '') {
  const files = []
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const path = join(prefix, entry.name)
    if (entry.isDirectory()) files.push(...await skillFiles(directory, path))
    else if (entry.isFile()) files.push(path)
    else throw new Error(`Unexpected HTML skill resource: ${path}`)
  }
  return files.sort()
}

async function verifyHtmlSkill(source, built) {
  const expected = await skillFiles(source)
  const actual = await skillFiles(built)
  if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error('HTML POC skill resources differ from the built runtime; rebuild the engine')
  for (const path of expected) {
    if (!(await readFile(join(source, path))).equals(await readFile(join(built, path)))) {
      throw new Error(`HTML POC skill resource differs from the built runtime: ${path}`)
    }
  }
}

async function stageScriptDependencies(runtime, destination, dependencies) {
  const fromRuntime = createRequire(join(runtime, 'package.json'))
  const coreEntry = fromRuntime.resolve('quickjs-emscripten-core')
  const fromCore = createRequire(coreEntry)
  const packages = [
    ['quickjs-emscripten-core', fromRuntime, dependencies['quickjs-emscripten-core']],
    ['@jitl/quickjs-wasmfile-release-sync', fromRuntime, dependencies['@jitl/quickjs-wasmfile-release-sync']],
    ['@jitl/quickjs-ffi-types', fromCore, dependencies['quickjs-emscripten-core']],
  ]
  for (const [name, resolver, version] of packages) {
    const source = dirname(dirname(resolver.resolve(name)))
    const metadata = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'))
    if (metadata.name !== name || metadata.version !== version) throw new Error(`Unexpected script dependency: ${name}`)
    await cp(source, join(destination, 'node_modules', name), {
      recursive: true, dereference: true, filter: path => !/\.d\.(?:ts|mts|cts)$|\.map$|\.tsbuildinfo$/.test(path),
    })
  }
}

export async function stageRuntime({ root, destination, revision }) {
  const runtime = join(root, 'packages/dsh-node-runtime')
  const metadata = JSON.parse(await readFile(join(runtime, 'package.json'), 'utf8'))
  const skillSource = await readFile(join(root, 'crates/op-ai-skills/skills/synapse-design/SKILL.md'))
  const builtSkill = await readFile(join(runtime, 'wasm/design-skill.md'))
  if (!skillSource.equals(builtSkill)) throw new Error('Design skill differs from the built runtime; rebuild the engine')
  await verifyHtmlSkill(join(root, 'crates/op-ai-skills/skills/synapse-design-html'), join(runtime, 'skills/synapse-design-html'))
  await rm(destination, { recursive: true, force: true })
  await mkdir(destination, { recursive: true })
  // Every runtime module, so an import added to the host cannot be left out
  // of the release; tests and test helpers stay behind.
  const modules = (await readdir(runtime)).filter(
    name => name.endsWith('.mjs') && !/\.test(?:-helper)?\.mjs$/.test(name),
  )
  for (const path of [
    'package.json', ...modules,
    'wasm/op_dsh_engine.js', 'wasm/op_dsh_engine_bg.wasm', 'wasm/design-skill.md', 'skills/synapse-design-html',
    'web-bundle/index.html', 'web-bundle/op_host_web.js',
    'web-bundle/op_host_web_bg.wasm', 'web-bundle/canvaskit',
    'web-bundle/assets/fonts', 'web-bundle/assets/iconify-catalog-core.json',
    'web-bundle/assets/iconify-catalog-brands.json',
    'web-bundle/assets/i18n',
  ]) {
    await mkdir(dirname(join(destination, path)), { recursive: true })
    await cp(join(runtime, path), join(destination, path), { recursive: true })
  }
  for (const path of ['web-bundle/snippets']) {
    try {
      await cp(join(runtime, path), join(destination, path), { recursive: true })
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  await stageScriptDependencies(runtime, destination, metadata.dependencies)
  await cp(join(root, 'LICENSE'), join(destination, 'LICENSE'))
  const { files } = await indexRuntimePayload(destination)
  const manifest = {
    schemaVersion: 2,
    runtime: 'node-wasm',
    entrypoint: 'cli.mjs',
    node: metadata.engines.node,
    packageName: metadata.name,
    openPencilVersion: metadata.version,
    openPencilRevision: revision,
    accountPolicy: 'disabled',
    files,
  }
  await writeFile(join(destination, 'openpencil-runtime.json'), JSON.stringify(manifest, null, 2) + '\n')
  return manifest
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const metadata = JSON.parse(await readFile(join(root, 'packages/dsh-node-runtime/package.json'), 'utf8'))
  const version = metadata.version
  if (process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME !== `runtime-v${version}`) {
    throw new Error(`Release tag must equal runtime-v${version}`)
  }
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
  execFileSync('git', ['diff', '--exit-code', 'HEAD'], { cwd: root, stdio: 'inherit' })
  if (execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: root, encoding: 'utf8' }).trim()) {
    throw new Error('Release staging requires a clean committed checkout')
  }
  const name = `dsh-design-pencil-${version}-node-wasm`
  const destination = join(root, 'dist', name)
  await stageRuntime({ root, destination, revision })
  const archive = join(root, 'dist', name + '.tar.gz')
  execFileSync('tar', ['-czf', archive, '-C', destination, '.'], { cwd: root, stdio: 'inherit' })
  const digest = createHash('sha256').update(await readFile(archive)).digest('hex')
  await writeFile(archive + '.sha256', `${digest}  ${name}.tar.gz\n`)
  console.log(JSON.stringify({ archive, sha256: digest, revision, version }, null, 2))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
