/**
 * GitHub Pages serves 404.html for unknown paths. Duplicating index.html lets
 * deep links like /dixit/lobby/ABC load the SPA shell so React Router can run.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const indexHtml = path.join(dist, 'index.html')
const fallbackHtml = path.join(dist, '404.html')

if (!fs.existsSync(indexHtml)) {
  console.warn('[copy-spa-fallback] dist/index.html missing — skip')
  process.exit(0)
}

fs.copyFileSync(indexHtml, fallbackHtml)
console.log('[copy-spa-fallback] dist/404.html written (SPA fallback for GitHub Pages)')
