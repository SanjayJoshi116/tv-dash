import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { SYSTEM_THEME, THEMES, resolveThemeName } from './src/themes'
import { BOOT_THEME_COLOR, themeBootScript } from './src/themeBootScript'

// Inline <head> script (src/themeBootScript.ts) + the theme-color meta it updates, emitted right
// before it (System-dark headerBg as the no-JS value — no theme color is hand-typed in
// index.html). AppThemeProvider (src/ThemeContext.tsx) sets the same values once React mounts.
function themeBoot(): Plugin {
  const code = themeBootScript()
  return {
    name: 'tvdash-theme-boot',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { name: 'theme-color', content: BOOT_THEME_COLOR }, injectTo: 'head' },
      { tag: 'script', children: code, injectTo: 'head' },
    ],
  }
}

// Installable + offline production build (service worker is build-only; dev is unchanged).
// Precaches the app shell; the CSV is data (and gitignored) → runtime NetworkFirst with a 3s
// timeout, falling back to the last copy. Posters (TMDB) are not cached. `prompt`: a new
// version waits for the user's Reload (UpdatePrompt) instead of swapping code mid-session.
const pwaTheme = THEMES[resolveThemeName(SYSTEM_THEME, true)]
const pwa = VitePWA({
  registerType: 'prompt',
  injectRegister: false,
  // Manifest icons are install-time only — not precached (see globIgnores)
  includeManifestIcons: false,
  manifest: {
    name: 'TV Dashboard',
    short_name: 'TV Dash',
    description: 'Personal TV watch-history dashboard',
    // start_url / scope: left to the plugin, which uses Vite's base (sub-path deploys)
    display: 'standalone',
    theme_color: pwaTheme.headerBg,
    background_color: pwaTheme.contentBg,
    icons: [
      // Relative: resolved against the manifest's URL, i.e. under the base
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    // manifest.webmanifest is added by the plugin itself; the pwa-*.png icons are only fetched
    // by the browser at install time, so they stay out of the precache
    globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
    globIgnores: ['pwa-*.png'],
    // Deep links (/shows/12) open offline; a URL with a file extension (/tv_series.csv opened in
    // a tab) is a file, not an app route — let it through to the network
    // Relative (the plugin's default, resolved under the SW's base) — never '/index.html'
    navigateFallback: 'index.html',
    navigateFallbackDenylist: [/\.[a-z0-9]+$/i],
    runtimeCaching: [
      {
        // Serialized into sw.js — must be self-contained (can't import CSV_FILE); endsWith so it
        // matches under any base
        urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.endsWith('/tv_series.csv'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'tvdash-data',
          // Long enough for a slow-but-working connection (a cached copy shows no notice while
          // online), short of useTvData's own 10s timeout
          networkTimeoutSeconds: 8,
          expiration: { maxEntries: 1 },
          cacheableResponse: { statuses: [200] },
        },
      },
    ],
  },
})

export default defineConfig({
  plugins: [react(), themeBoot(), pwa],
  server: {
    host: true,
  },
})
