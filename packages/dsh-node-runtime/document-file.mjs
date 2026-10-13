import { randomUUID } from 'node:crypto'
import { open, readFile, rename, stat, unlink } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

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