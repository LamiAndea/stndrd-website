// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://stndrd-website.vercel.app',
  // Static output; the waitlist API route opts out via `prerender = false`
  output: 'static',
  adapter: vercel(),
});
