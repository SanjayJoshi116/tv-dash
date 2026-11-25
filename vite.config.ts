import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { SYSTEM_THEME, THEMES, resolveThemeName } from './src/themes'
import { RESET_PARAM, SETTINGS_KEY } from './src/utils/settings'

// Inline <head> script: applies the saved (or OS-resolved) theme's color scheme, background and
// theme-color meta (headerBg) before the bundle loads, so there's no dark/white flash. Generated
// from THEMES so the colors stay single-sourced. Also emits that meta itself (System-dark headerBg
// as the no-JS value) right before the script — no theme color is hand-typed in index.html.
// Reads SETTINGS_KEY directly (settings.ts isn't loaded yet) — read-only.
// AppThemeProvider (src/ThemeContext.tsx) sets the same three values once React mounts.
// With `?reset` the saved theme is ignored (main.tsx clears it before React renders), so first
// paint already shows the System theme — same raw-segment rule as consumeResetParam.
function themeBootScript(): Plugin {
  const map = Object.fromEntries(
    Object.values(THEMES).map(t => [t.name, [t.isDark ? 'dark' : 'light', t.contentBg, t.headerBg]]),
  )
  // Same System mapping as the app (themes.ts), so first paint can't disagree with it
  const dark = resolveThemeName(SYSTEM_THEME, true)
  const light = resolveThemeName(SYSTEM_THEME, false)
  const code = `(function(){var m=${JSON.stringify(map)},t;` +
    `try{var reset=location.search.slice(1).split('&').some(function(p){return p.split('=')[0]===${JSON.stringify(RESET_PARAM)}});` +
    `var s=reset?null:JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)})||'{}');` +
    `if(s&&typeof s.themeName==='string'&&Object.prototype.hasOwnProperty.call(m,s.themeName))t=m[s.themeName]}catch(e){}` +
    `if(!t){var d=false;try{d=matchMedia('(prefers-color-scheme: dark)').matches}catch(e){}` +
    `t=m[d?${JSON.stringify(dark)}:${JSON.stringify(light)}]}` +
    `var r=document.documentElement.style;r.colorScheme=t[0];r.backgroundColor=t[1];` +
    `var mt=document.querySelector('meta[name="theme-color"]');if(mt)mt.setAttribute('content',t[2])})()`
  return {
    name: 'tvdash-theme-boot',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { name: 'theme-color', content: THEMES[dark].headerBg }, injectTo: 'head' },
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
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: pwaTheme.headerBg,
    background_color: pwaTheme.contentBg,
    icons: [
      { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    // manifest.webmanifest is added by the plugin itself; the pwa-*.png icons are only fetched
    // by the browser at install time, so they stay out of the precache
    globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
    globIgnores: ['pwa-*.png'],
    // Deep links (/shows/12) open offline; a URL with a file extension (/tv_series.csv opened in
    // a tab) is a file, not an app route — let it through to the network
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/\.[a-z0-9]+$/i],
    runtimeCaching: [
      {
        urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname === '/tv_series.csv',
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
  plugins: [react(), themeBootScript(), pwa],
  server: {
    host: true,
  },
})
