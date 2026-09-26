import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
export default defineConfig({ output: 'static', site: process.env.DOCS_SITE, base: process.env.DOCS_BASE || '/', outDir: './build', integrations: [react()], vite: { ssr: { noExternal: [/^@klein-ui\//] } } });
