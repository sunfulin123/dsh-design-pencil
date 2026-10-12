import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { chmod, cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const version = '0.8.5-synapse.1'
const platform = 'darwin-arm64'
if (process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME !== `runtime-v${version}`) {
  throw new Error(`Release tag must equal runtime-v${version}`)
}
if (process.platform !== 'darwin' || process.arch !== 'arm64') {
  throw new Error('The DSH runtime release supports macOS arm64 only')
}
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
execFileSync('git', ['diff', '--exit-code', 'HEAD'], { cwd: root, stdio: 'inherit' })
if (execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: root, encoding: 'utf8' }).trim()) {
  throw new Error('Release staging requires a clean committed checkout')
}
const name = `dsh-design-pencil-${version}-${platform}`
const destination = join(root, 'dist', name)
await rm(destination, { recursive: true, force: true })
await mkdir(join(destination, 'bin'), { recursive: true })
await cp(join(root, 'target/release/op-host-web-server'), join(destination, 'bin/op-host-web-server'))
await chmod(join(destination, 'bin/op-host-web-server'), 0o755)
await cp(join(root, 'crates/op-host-web/pkg'), join(destination, 'bin/web-bundle'), {
  recursive: true,
  filter: path => !path.endsWith('.d.ts') && !path.endsWith('.opt.wasm'),
})
await cp(join(root, 'crates/op-host-web/assets/canvaskit'), join(destination, 'bin/web-bundle/canvaskit'), { recursive: true })
for (const path of [
  'crates/op-cli/assets/skill-bundle.json',
  'crates/op-editor-ui/assets/iconify-catalog-core.json',
  'crates/op-editor-ui/assets/iconify-catalog-brands.json',
  'crates/op-ai-skills/skills/style-guides',
  'crates/op-ai-skills/skills/domains',
  'crates/op-editor-core/assets/scene_templates',
]) {
  const target = join(destination, 'resources', path)
  await mkdir(dirname(target), { recursive: true })
  await cp(join(root, path), target, { recursive: true })
}
execFileSync(process.execPath, [
  join(root, 'scripts/sync-dsh-viewer.mjs'),
  '--openpencil-root', root,
  '--out-dir', join(destination, 'viewer-assets'),
  '--esbuild', join(root, 'packages/dsh-runtime-build/node_modules/.bin/esbuild'),
], { cwd: root, stdio: 'inherit' })
await cp(join(root, 'LICENSE'), join(destination, 'LICENSE'))
await cp(join(root, 'crates/op-host-web/assets/canvaskit/LICENSE'), join(destination, 'viewer-assets/canvaskit/LICENSE'))
const files = {}
async function hashTree(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    const relative = prefix + entry.name
    if (entry.isSymbolicLink()) throw new Error(`Release contains a symlink: ${relative}`)
    if (entry.isDirectory()) await hashTree(path, relative + '/')
    else if (entry.isFile()) files[relative] = createHash('sha256').update(await readFile(path)).digest('hex')
    else throw new Error(`Release contains an unsupported entry: ${relative}`)
  }
}
await hashTree(destination)
await writeFile(join(destination, 'openpencil-runtime.json'), JSON.stringify({
  schemaVersion: 1,
  platform,
  packageName: '@sunfulin123/dsh-design-pencil-darwin-arm64',
  openPencilVersion: version,
  openPencilRevision: revision,
  upstreamRevision: '40902a3fa595a78b6f97e9409875cef823b0e191',
  accountPolicy: 'disabled',
  files,
}, null, 2) + '\n')
const archive = join(root, 'dist', name + '.tar.gz')
execFileSync('tar', ['-czf', archive, '-C', destination, '.'], { cwd: root, stdio: 'inherit' })
const digest = createHash('sha256').update(await readFile(archive)).digest('hex')
await writeFile(archive + '.sha256', `${digest}  ${name}.tar.gz\n`)
console.log(JSON.stringify({ archive, sha256: digest, revision, version }, null, 2))