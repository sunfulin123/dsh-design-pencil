import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const MAC_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
]
const LINUX_CANDIDATES = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']
const WINDOWS_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
]

function onPath(command) {
  const result = spawnSync('which', [command], { encoding: 'utf8' })
  const found = result.status === 0 ? result.stdout.trim() : ''
  return found || null
}

// Locates a Chromium-family browser able to run the CanvasKit editor headless.
export function findChrome({ env = process.env, platform = process.platform, exists = existsSync, which = onPath } = {}) {
  if (env.DSH_CHROME_PATH) return exists(env.DSH_CHROME_PATH) ? env.DSH_CHROME_PATH : null
  if (platform === 'darwin') return MAC_CANDIDATES.find(path => exists(path)) ?? null
  if (platform === 'win32') return WINDOWS_CANDIDATES.find(path => exists(path)) ?? null
  for (const command of LINUX_CANDIDATES) {
    const path = which(command)
    if (path) return path
  }
  return null
}

export function headlessArguments(url, profileDir) {
  return [
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--mute-audio',
    '--hide-scrollbars',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--window-size=1600,1000',
    `--user-data-dir=${profileDir}`,
    url,
  ]
}

/**
 * Keeps one hidden Chrome running the editor in render-only mode so MCP
 * screenshots work without a visible editor tab. Started on demand, stopped
 * after `idleMs` without requests or when the host closes.
 */
export class HeadlessRenderer {
  #baseUrl
  #chromePath
  #idleMs
  #spawn
  #log
  #child = null
  #profileDir = null
  #idleTimer = null
  #starting = null
  #closed = false

  constructor({ baseUrl, chromePath = findChrome(), idleMs = 300_000, spawnImpl = spawn, log = () => {} }) {
    this.#baseUrl = baseUrl
    this.#chromePath = chromePath
    this.#idleMs = idleMs
    this.#spawn = spawnImpl
    this.#log = log
  }

  get available() {
    return Boolean(this.#chromePath) && !this.#closed
  }

  get running() {
    return this.#child !== null
  }

  // Starts Chrome if needed. Readiness is signalled by the page polling the
  // screenshot queue, which the screenshot renderer tracks.
  async ensure() {
    if (this.#closed) return { ok: false, reason: 'The rendering host is closed' }
    if (!this.#chromePath) return { ok: false, reason: 'No Chrome or Chromium was found (set DSH_CHROME_PATH)' }
    this.touch()
    if (this.#child) return { ok: true, started: false }
    this.#starting ??= this.#start().finally(() => { this.#starting = null })
    return this.#starting
  }

  touch() {
    if (this.#idleTimer) clearTimeout(this.#idleTimer)
    this.#idleTimer = setTimeout(() => { this.#stop() }, this.#idleMs)
    this.#idleTimer.unref?.()
  }

  async #start() {
    this.#profileDir = await mkdtemp(join(tmpdir(), 'dsh-headless-'))
    const url = `${this.#baseUrl}/?renderer=headless`
    let child
    try {
      child = this.#spawn(this.#chromePath, headlessArguments(url, this.#profileDir), { stdio: 'ignore' })
    } catch (error) {
      await this.#removeProfile()
      return { ok: false, reason: `Chrome could not start: ${error.message}` }
    }
    this.#child = child
    child.once?.('exit', () => {
      if (this.#child === child) {
        this.#child = null
        this.#removeProfile()
      }
    })
    child.once?.('error', error => this.#log(`headless renderer failed: ${error.message}`))
    this.#log(`headless renderer started for ${url}`)
    return { ok: true, started: true }
  }

  async #removeProfile() {
    const dir = this.#profileDir
    this.#profileDir = null
    if (dir) await rm(dir, { recursive: true, force: true }).catch(() => {})
  }

  async #stop() {
    if (this.#idleTimer) clearTimeout(this.#idleTimer)
    this.#idleTimer = null
    const child = this.#child
    this.#child = null
    if (child) {
      const exited = new Promise(resolve => {
        if (child.exitCode !== null && child.exitCode !== undefined) resolve()
        else child.once?.('exit', resolve)
        setTimeout(resolve, 2000).unref?.()
      })
      try { child.kill('SIGTERM') } catch {}
      await exited
    }
    await this.#removeProfile()
  }

  async close() {
    this.#closed = true
    await this.#starting?.catch(() => {})
    await this.#stop()
  }
}
