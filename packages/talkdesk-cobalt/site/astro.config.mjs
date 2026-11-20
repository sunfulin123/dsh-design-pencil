import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
export default defineConfig({
  integrations: [mdx()],
  output: 'static',
  redirects: {
    '/reference/components/extensions/button/': '/reference/components/core/button/button/',
  },
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false },
  },
});
