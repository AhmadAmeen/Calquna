import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://calquna.pages.dev',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: false,
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    build: {
      cssMinify: false,
    },
  },
});
