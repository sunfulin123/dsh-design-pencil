import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { indexRuntimePayload } from './dsh-runtime-payload.mjs'

export async function stageRuntime({ root, destination, revision }) {
  const runtime = join(root, 'packages/dsh-node-runtime')
  const metadata = JSON.parse(await readFile(join(runtime, 'package.json'), 'utf8'))
  await rm(destination, { recursive: true, force: true })
  await mkdir(destination, { recursive: true })
  for (const path of [
    'package.json', 'cli.mjs', 'document-file.mjs', 'document-store.mjs',
    'engine-session.mjs', 'node-host.mjs', 'static-assets.mjs',
    'wasm/op_dsh_engine.js', 'wasm/op_dsh_engine_bg.wasm',
    'web-bundle/index.html', 'web-bundle/op_host_web.js',
    'web-bundle/op_host_web_bg.wasm', 'web-bundle/canvaskit',
    'web-bundle/assets/fonts', 'web-bundle/assets/iconify-catalog-core.json',
    'web-bundle/assets/iconify-catalog-brands.json',
    'web-bundle/assets/scene_templates', 'web-bundle/assets/i18n',
  ]) {
    await mkdir(dirname(join(destination, path)), { recursive: true })
    await cp(join(runtime, path), join(destination, path), { recursive: true })
  }
  for (const path of ['web-bundle/snippets', 'web-bundle/assets/scene_template_previews']) {
    try {
      await cp(join(runtime, path), join(destination, path), { recursive: true })
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
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