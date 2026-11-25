// GitHub Pages has no SPA fallback: a deep link like /tv-dash/shows/12 gets the site's 404 page.
// Serving a copy of the app's entry page as 404.html makes Pages load the app for every unknown
// path; the router then renders the right page (or its own "Page not found").
// Usage (after a build): node scripts/copy-404.mjs [outDir]   (default: dist)
import { copyFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const outDir = process.argv[2] ?? 'dist'
const index = join(outDir, 'index.html')
if (!existsSync(index)) {
  console.error(`copy-404: ${index} not found — run the build first`)
  process.exit(1)
}
copyFileSync(index, join(outDir, '404.html'))
console.log(`copy-404: ${index} → ${join(outDir, '404.html')}`)
