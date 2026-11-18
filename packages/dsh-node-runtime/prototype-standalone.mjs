/** Standalone Cobalt application bootstrap with ordinary HTML review controls, without Workspace. */
import { readFile, writeFile, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
export async function createStandalone({ project, pages, toolkit, signal }) {
  signal?.throwIfAborted();
  const root = resolve(toolkit, '..');
  const templates = existsSync(join(root, 'templates/dependencies.json'))
    ? join(root, 'templates')
    : join(root, 'templates/cobalt');
  const library = existsSync(join(root, 'components/extensions/src'))
    ? root + '/'
    : join(root, 'cobalt-reference');
  const review = existsSync(join(root, '../html-prototype-review/scripts/html-review/review.html'))
    ? join(root, '../html-prototype-review/scripts/html-review')
    : join(toolkit, 'html-review');
  const stage = await mkdtemp(join(dirname(project), '.standalone-prototype-'));
  const put = async (name, text) => {
    await mkdir(dirname(join(stage, name)), { recursive: true });
    await writeFile(join(stage, name), text, { flag: 'wx' });
  };
  try {
    const { writeSourceResources } = await import(
      pathToFileURL(join(toolkit, 'cobalt-source-templates.mjs'))
    );
    await writeSourceResources(library, stage);
    for (const name of ['.npmrc', 'tsconfig.json', 'pnpm-workspace.yaml'])
      await put(name, await readFile(join(templates, 'project', name)));
    const dependencies = {
      ...JSON.parse(await readFile(join(templates, 'dependencies.json'))),
      ...JSON.parse(await readFile(join(library, 'components/extensions/dependencies.json'))),
      react: '18.3.1',
      'react-dom': '18.3.1',
    };
    await put(
      'package.json',
      JSON.stringify({
        name: 'cobalt-standalone-prototype',
        private: true,
        type: 'module',
        packageManager: 'pnpm@11.7.0',
        scripts: {
          dev: 'vite --host 127.0.0.1',
          check: 'node tools/inspect-business-source.mjs && tsc --noEmit',
          build: 'node tools/inspect-business-source.mjs && vite build',
          preview: 'vite preview --host 127.0.0.1',
        },
        dependencies,
        devDependencies: {
          vite: '6.4.1',
          '@vitejs/plugin-react': '4.7.0',
          typescript: '5.8.3',
          '@types/react': '18.3.20',
          '@types/react-dom': '18.3.6',
        },
      }),
    );
    await put(
      'vite.config.ts',
      (await readFile(join(templates, 'project/vite.config.ts'), 'utf8')).replace(
        'rollupOptions: {',
        'rollupOptions: {\n      input: { index: "index.html", business: "business.html" },',
      ),
    );
    await put(
      'tools/inspect-business-source.mjs',
      await readFile(join(toolkit, 'inspect-business-source.mjs')),
    );
    await put(
      'talkdesk-prototype.json',
      JSON.stringify({
        schemaVersion: 1,
        apps: [{ id: 'prototype', title: 'Prototype', iconName: 'home', pages }],
      }),
    );
    for (const name of ['review.js', 'review.css', 'chrome.css', 'page.js'])
      await put('public/prototype-review/' + name, await readFile(join(review, name)));
    await put(
      'index.html',
      (await readFile(join(review, 'review.html'), 'utf8')).replace(
        '@@CONFIG@@',
        JSON.stringify({
          entry: './business.html',
          defaultState: 'success',
          states: ['success', 'loading', 'empty', 'error', 'partial', 'permission'],
        }),
      ),
    );
    await put(
      'business.html',
      `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="./prototype-review/page.js" defer></script></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
    );
    await put(
      'src/prototype-runtime/theme.ts',
      await readFile(join(templates, 'vendor/workspace-shell/theme.ts')),
    );
    await put(
      'src/prototype-runtime/base.css',
      await readFile(join(templates, 'vendor/workspace-shell/base.css')),
    );
    await put(
      'src/prototype-runtime/scenarios.tsx',
      `export function usePrototypeScenario(){return new URLSearchParams(location.search).get('prototypeState')||'success';}`,
    );
    await put(
      'src/main.tsx',
      `import { lazy, Suspense, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import ThemeProvider from '@talkdesk/cobalt-react-theme-provider';
import ViewportProvider from '@talkdesk/cobalt-react-viewport-provider';
import PortalProvider from '@talkdesk/cobalt-react-portal-provider';
import '@talkdesk/cobalt-theme-base/dist/styles.css';
import './prototype-runtime/base.css';
import { loadThemeStylesheet, setColorScheme, systemScheme, onSystemSchemeChange, stylesheetTheme } from './prototype-runtime/theme';
loadThemeStylesheet();
setColorScheme(systemScheme());
onSystemSchemeChange(setColorScheme);
const pages = import.meta.glob<{ default: ComponentType }>('./apps/prototype/pages/*.tsx');
const id = new URLSearchParams(location.search).get('page') || ${JSON.stringify(pages[0].id)};
const Page = lazy(pages['./apps/prototype/pages/' + id + '.tsx'] || pages[${JSON.stringify('./apps/prototype/pages/' + pages[0].id + '.tsx')}]);
createRoot(document.getElementById('root')!).render(
  <ThemeProvider loader={stylesheetTheme}>
    <ViewportProvider><PortalProvider><Suspense fallback={null}><Page /></Suspense></PortalProvider></ViewportProvider>
  </ThemeProvider>
);
`,
    );
    for (const page of pages)
      await put(
        'src/apps/prototype/pages/' + page.id + '.tsx',
        `import{Heading,Text}from'@talkdesk/cobalt-react-typography';export default function Page(){return <section><Heading level={1}>{${JSON.stringify(page.title)}}</Heading><Text>Cobalt business page scaffold — Replace with the planned content and interactions.</Text></section>;}`,
      );
    signal?.throwIfAborted();
    await rename(stage, project);
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
}
