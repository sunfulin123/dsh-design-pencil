import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const packages = execFileSync('cargo', [
  'tree', '--locked',
  '-p', 'op-dsh-engine', '-p', 'op-host-web',
  '--no-default-features',
  '--features', 'op-host-web/canvaskit',
  '--target', 'wasm32-unknown-unknown',
  '--edges', 'normal', '--prefix', 'none', '--format', '{p}',
], { cwd: root, encoding: 'utf8' })
const names = new Set(packages.trim().split('\n').map(line => line.split(' v')[0]))
const forbidden = [
  'agent', 'anthropic-agent-sdk', 'github-copilot-sdk',
  'op-auth-bridge', 'op-collab-host', 'op-collab-transport',
  'op-collab-relay-client', 'op-collab-relay-control-plane',
  'op-host-native', 'op-host-services', 'op-host-web-server',
  'op-host-desktop', 'op-chat-agent', 'casement', 'winit', 'glutin',
  'skia-safe', 'skia-bindings', 'tokio', 'reqwest',
]
const included = forbidden.filter(name => names.has(name))

assert.deepEqual(included, [], `DSH runtime includes standalone services: ${included.join(', ')}`)
console.log(`DSH WASM dependency policy passed (${names.size} packages).`)