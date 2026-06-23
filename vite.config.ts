import { createHash } from 'node:crypto'
import { basename } from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// CSS Modules localises every class AND every `animation`/`@keyframes` name it
// sees — including bare references to keyframes defined in the global motion
// layer (src/styles/animations.css). That rewrites `il-spin` to a hashed name
// that no longer matches the global `@keyframes`, silently killing the
// animation. We keep the `il-`-prefixed motion-layer names global (they're
// namespaced precisely so they can be shared) and scope everything else as
// usual, file-stably.
function generateScopedName(name: string, filename: string, css: string): string {
  if (name.startsWith("il-")) return name;
  const file = basename(filename).replace(/\.module\.\w+$/, "");
  const hash = createHash("sha256").update(`${filename}:${css}`).digest("base64url").slice(0, 6);
  return `${file}_${name}_${hash}`;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      generateScopedName,
    },
  },
  server: {
    // Forward /api calls from the Vite dev server (:5173) to the Express API (:3000),
    // reproducing the production same-origin model in development.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setupTests.ts'],
  },
})
