// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://stndrdhq.com',
  // Static output; the waitlist API route opts out via `prerender = false`
  output: 'static',
  adapter: vercel(),
});
