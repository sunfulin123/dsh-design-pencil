import { createHash } from 'node:crypto'
import { link, lstat, readdir, readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'

export async function indexRuntimePayload(root) {
  const files = {}
  const contents = new Map()
  let savedBytes = 0
  async function visit(directory, prefix = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      const relative = prefix + entry.name
      if (entry.isSymbolicLink()) throw new Error(`Runtime payload contains a symlink: ${relative}`)
      if (entry.isDirectory()) await visit(path, relative + '/')
      else if (entry.isFile()) {
        const hash = createHash('sha256').update(await readFile(path)).digest('hex')
        const info = await lstat(path)
        const key = `${hash}:${info.mode & 0o7777}`
        const existing = contents.get(key)
        if (existing) {
          await unlink(path)
          await link(existing, path)
          savedBytes += info.size
        } else contents.set(key, path)
        files[relative] = hash
      }
      else throw new Error(`Runtime payload contains an unsupported entry: ${relative}`)
    }
  }
  await visit(root)
  return { files, savedBytes }
}