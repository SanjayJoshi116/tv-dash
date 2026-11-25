import { CSV_FILE } from './csvFile'

// App URLs relative to Vite's base (`/` by default, `/<repo>/` with `vite build --base=/<repo>/`).
// Never hardcode an absolute app URL ('/tv_series.csv', '/index.html'): it 404s under a sub-path.

// Vite's base as an absolute path with a trailing slash. A relative base (`--base=./`) is
// resolved once, against the page the app was opened at — so it works when opened at its folder,
// and the CSV URL / router basename stay fixed while the SPA navigates (a relative './…' fetch
// would follow the current route). Absolute bases pass through unchanged.
export function resolveBase(base: string, pageUrl: string): string {
  if (base.startsWith('/')) return base
  const path = new URL(base, pageUrl).pathname
  return path.endsWith('/') ? path : `${path}/`
}

const BASE = typeof document === 'undefined'
  ? import.meta.env.BASE_URL
  : resolveBase(import.meta.env.BASE_URL, document.baseURI)

export const BASE_PATH = BASE.replace(/\/+$/, '') // '' at the domain root
export const CSV_URL = `${BASE}${CSV_FILE}`
