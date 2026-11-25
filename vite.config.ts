import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { SYSTEM_THEME, THEMES, resolveThemeName } from './src/themes'
import { RESET_PARAM, SETTINGS_KEY } from './src/utils/settings'

// Inline <head> script: applies the saved (or OS-resolved) theme's color scheme + background
// before the bundle loads, so there's no dark/white flash. Generated from THEMES so the colors
// stay single-sourced. Reads SETTINGS_KEY directly (settings.ts isn't loaded yet) — read-only.
// AppThemeProvider (src/ThemeContext.tsx) sets the same two properties once React mounts.
// With `?reset` the saved theme is ignored (main.tsx clears it before React renders), so first
// paint already shows the System theme — same raw-segment rule as consumeResetParam.
function themeBootScript(): Plugin {
  const map = Object.fromEntries(
    Object.values(THEMES).map(t => [t.name, [t.isDark ? 'dark' : 'light', t.contentBg]]),
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
    `var r=document.documentElement.style;r.colorScheme=t[0];r.backgroundColor=t[1]})()`
  return {
    name: 'tvdash-theme-boot',
    transformIndexHtml: () => [{ tag: 'script', children: code, injectTo: 'head' }],
  }
}

export default defineConfig({
  plugins: [react(), themeBootScript()],
  server: {
    host: true,
  },
})
