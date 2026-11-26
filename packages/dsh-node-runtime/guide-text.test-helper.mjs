/** Read a reference guide as one text: its index file followed by its section files in name order. */
import { readdir, readFile } from 'node:fs/promises'

/**
 * @param {string | URL} guide - path or URL of the guide's index `.md`; sections live in the folder of the same name.
 * @returns {Promise<string>} the index text, then every section and summary, so phrase checks cover the whole guide.
 */
export async function readGuide(guide) {
  const index = await readFile(guide, 'utf8')
  const folder = new URL(String(guide).replace(/\.md$/u, '/'), guide instanceof URL ? guide : `file://${guide}`)
  let names = []
  try { names = (await readdir(folder)).filter(name => name.endsWith('.md')).toSorted() } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const sections = await Promise.all(names.map(name => readFile(new URL(name, folder), 'utf8')))
  return [index, ...sections].join('\n')
}
