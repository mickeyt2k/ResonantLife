import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.resonantlife.net',
  output: 'static',
  build: {
    format: 'directory',
  },
  trailingSlash: 'ignore',
  // The /worker directory is a separate, self-contained Cloudflare Worker
  // project (with its own tsconfig and its own dependencies). Astro / Vite
  // should not watch, scan, or reload anything inside it.
  vite: {
    server: {
      watch: {
        ignored: ['**/worker/**', '**/.wrangler/**'],
      },
    },
  },
});
