import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const packages = execFileSync('cargo', [
  'tree', '--locked',
  '-p', 'op-host-web-server',
  '--no-default-features',
  '--target', 'aarch64-apple-darwin',
  '--edges', 'normal', '--prefix', 'none', '--format', '{p}',
], { cwd: root, encoding: 'utf8' })
const names = new Set(packages.trim().split('\n').map(line => line.split(' v')[0]))
const forbidden = [
  'anthropic-agent-sdk', 'github-copilot-sdk',
  'op-auth-bridge', 'op-collab-host', 'op-collab-transport',
  'op-collab-relay-client', 'op-collab-relay-control-plane',
  'op-preview-core', 'op-host-desktop', 'winit', 'glutin',
]
const included = forbidden.filter(name => names.has(name))

assert.deepEqual(included, [], `DSH runtime includes standalone services: ${included.join(', ')}`)
console.log(`DSH daemon dependency policy passed (${names.size} packages).`)