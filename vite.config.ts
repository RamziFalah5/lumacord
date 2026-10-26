import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/lumacord/' : './',
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem,key}', '**/references/**', '**/.reference-analysis/**', '**/.local-backup/**'] },
  },
}));
