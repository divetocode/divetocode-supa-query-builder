import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: 'esm',
    outExtension: () => ({ js: '.mjs' }),
    outDir: 'dist',
    dts: true
  },
  {
    entry: ['src/index.ts'],
    format: 'cjs',
    outExtension: () => ({ js: '.cjs' }),
    outDir: 'dist'
  }
]);
