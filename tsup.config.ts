import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // The handle dataset is small and inlined into the bundle so consumers get
  // it for free; the raw JSON is still shipped (see package.json "files") so
  // it can be imported directly or PR'd against.
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
});
