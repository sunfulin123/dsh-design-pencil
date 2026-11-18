import { createHash, randomUUID } from 'node:crypto'
import { open, readFile, rename, stat, unlink } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

function businessSlug(name) {
  const normalized = name.normalize('NFKC').toLowerCase().trim().replace(/^\/synapse-design(?:\s+|$)/u, '')
  const slug = normalized.replace(/[^\p{Letter}\p{Mark}\p{Number}]+/gu, '-').replace(/^-|-$/gu, '')
  return Array.from(slug).slice(0, 56).join('').replace(/-$/u, '') || 'design'
}

/** Derive a workspace-relative directory from the business name and immutable task identity. */
export function designTaskDirectory(kind, name, taskId) {
  if (kind !== 'html-design' && kind !== 'op-design') throw new TypeError('Invalid design task kind')
  if (typeof taskId !== 'string' || taskId.length === 0) throw new TypeError('A generated design requires a task identity')
  const hash = createHash('sha256').update(taskId).digest('hex').slice(0, 12)
  return join('.synapse', kind, 'tasks', `${businessSlug(name)}-${hash}`)
}

/** Place a new OP in its task directory. Use literal paths for existing files. */
export function generatedOpPath(name, taskId) {
  const title = /\.op$/iu.test(name) ? basename(name).slice(0, -3) : name
  return join(designTaskDirectory('op-design', title, taskId), `${businessSlug(title)}.op`)
}

export async function readDocumentFile(sourcePath) {
  try {
    return await readFile(sourcePath)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

export async function writeDocumentFile(sourcePath, document, expectedContents) {
  let mode = 0o600
  try {
    const current = await stat(sourcePath)
    if (!current.isFile()) throw new Error('The bound document is not a regular file')
    mode = current.mode & 0o777
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const temporaryPath = join(dirname(sourcePath), `.${basename(sourcePath)}.${randomUUID()}.tmp`)
  const handle = await open(temporaryPath, 'wx', mode)
  const contents = Buffer.from(`${JSON.stringify(document, null, 2)}\n`)
  try {
    await handle.writeFile(contents)
    await handle.sync()
    await handle.close()
    const current = await readDocumentFile(sourcePath)
    if (!(current === null && expectedContents === null) && !(current && expectedContents && current.equals(expectedContents))) {
      const error = new Error('The bound document changed on disk')
      error.code = 'file-conflict'
      throw error
    }
    await rename(temporaryPath, sourcePath)
    return contents
  } finally {
    await handle.close()
    await unlink(temporaryPath).catch(error => {
      if (error.code !== 'ENOENT') throw error
    })
  }
}