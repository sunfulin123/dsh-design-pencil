/** Check owned Workspace source before building; business pages and Extensions remain editable. */
import { createHash } from 'node:crypto';
import { readFile, lstat, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const protectedPath = (path) =>
  path === 'src/main.tsx' ||
  path === 'tools/verify-workspace-shell.mjs' ||
  path.startsWith('src/workspace-shell/') ||
  path.startsWith('src/prototype-runtime/');
export async function verifyWorkspaceShell(root) {
  root = resolve(root);
  const source = JSON.parse(await readFile(join(root, 'cobalt-source.json'), 'utf8'));
  if (
    source.adapterVersion !== 7 ||
    !source.protectedFiles ||
    !Object.keys(source.protectedFiles).length
  )
    throw new Error(
      'Missing current Workspace integrity metadata; create a new project with the current helper.',
    );
  const actualPaths = [];
  async function inventory(path) {
    const stat = await lstat(join(root, path));
    if (stat.isSymbolicLink()) throw new Error(`Protected Workspace symlink: ${path}`);
    if (stat.isDirectory())
      for (const name of await readdir(join(root, path))) await inventory(`${path}/${name}`);
    else actualPaths.push(path);
  }
  for (const path of [
    'src/main.tsx',
    'src/workspace-shell',
    'src/prototype-runtime',
    'tools/verify-workspace-shell.mjs',
  ])
    await inventory(path);
  if (
    JSON.stringify(actualPaths.sort()) !== JSON.stringify(Object.keys(source.protectedFiles).sort())
  )
    throw new Error('Protected Workspace inventory changed; restore the canonical template.');
  for (const [path, expected] of Object.entries(source.protectedFiles)) {
    if (
      !protectedPath(path) ||
      path.includes('\\') ||
      path.split('/').some((part) => !part || part === '.' || part === '..') ||
      !/^[a-f0-9]{64}$/.test(expected)
    )
      throw new Error(`Invalid protected Workspace path or hash: ${path}`);
    let current = root;
    for (const part of path.split('/')) {
      current = join(current, part);
      if ((await lstat(current)).isSymbolicLink())
        throw new Error(`Protected Workspace symlink: ${path}`);
    }
    const actual = createHash('sha256')
      .update(await readFile(join(root, path)))
      .digest('hex');
    if (actual !== expected)
      throw new Error(
        `Protected Workspace source changed: ${path}. Restore the canonical template; register business routes through talkdesk-prototype.json.`,
      );
  }
  return { status: 'verified', files: Object.keys(source.protectedFiles).length };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifyWorkspaceShell(resolve(dirname(fileURLToPath(import.meta.url)), '..'))
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
