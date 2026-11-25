// The inline <head> script `vite.config.ts` injects (tvdash-theme-boot plugin): applies the theme's
// color scheme, background and theme-color meta (headerBg) before the bundle loads, so there's no
// flash. Generated from THEMES so colors stay single-sourced; resolves exactly like the app:
//   1. `?theme=<option>` (readThemeOverride: decoded, trimmed, case-insensitive, first param)
//   2. else the saved `themeName` (ignored with `?reset` — same raw-segment rule as
//      consumeResetParam; main.tsx clears it before React renders)
//   3. a named theme → its colors; Custom → its saved `customTheme.base` (invalid → dark);
//      System / anything else → the OS color scheme (Default Dark / Default Light)
// Reads SETTINGS_KEY directly (settings.ts isn't loaded yet) — read-only. Every step is in
// try/catch: a broken storage or URL API must never block the page.
// Only imports import-free modules (themes.ts, settings.ts): vite.config.ts (tsconfig.node.json)
// imports this; themeBootScript.test.ts runs the generated code in jsdom.
import { CUSTOM_BASES, CUSTOM_THEME, SYSTEM_THEME, THEMES, THEME_OPTIONS, THEME_PARAM, resolveThemeName } from './themes'
import { RESET_PARAM, SETTINGS_KEY } from './utils/settings'

const json = JSON.stringify

// Same System mapping as the app (themes.ts), so first paint can't disagree with it
const SYSTEM_DARK = resolveThemeName(SYSTEM_THEME, true)
const SYSTEM_LIGHT = resolveThemeName(SYSTEM_THEME, false)

// System-dark headerBg: the no-JS value of the theme-color meta the plugin emits
export const BOOT_THEME_COLOR = THEMES[SYSTEM_DARK].headerBg

export function themeBootScript(): string {
  const map = Object.fromEntries(
    Object.values(THEMES).map(t => [t.name, [t.isDark ? 'dark' : 'light', t.contentBg, t.headerBg]]),
  )
  return `(function(){var m=${json(map)},o=${json(THEME_OPTIONS)},n=null,s=null,t;` +
    // 1. URL override; then saved settings unless ?reset
    `try{var q=location.search,` +
    `reset=q.slice(1).split('&').some(function(p){return p.split('=')[0]===${json(RESET_PARAM)}}),` +
    `v=new URLSearchParams(q).get(${json(THEME_PARAM)});` +
    `if(v!==null){v=v.trim().toLowerCase();for(var i=0;i<o.length;i++)if(o[i].toLowerCase()===v){n=o[i];break}}` +
    `if(!reset)s=JSON.parse(localStorage.getItem(${json(SETTINGS_KEY)})||'{}')}catch(e){}` +
    // 2. preference → colors
    `try{if(n===null&&s&&typeof s.themeName==='string')n=s.themeName;` +
    `if(n!==null&&Object.prototype.hasOwnProperty.call(m,n))t=m[n];` +
    `else if(n===${json(CUSTOM_THEME)}){var c=s&&s.customTheme;` +
    `t=m[c&&c.base==='light'?${json(CUSTOM_BASES.light)}:${json(CUSTOM_BASES.dark)}]}}catch(e){}` +
    // 3. System / invalid → OS color scheme
    `if(!t){var d=false;try{d=matchMedia('(prefers-color-scheme: dark)').matches}catch(e){}` +
    `t=m[d?${json(SYSTEM_DARK)}:${json(SYSTEM_LIGHT)}]}` +
    `var r=document.documentElement.style;r.colorScheme=t[0];r.backgroundColor=t[1];` +
    `var mt=document.querySelector('meta[name="theme-color"]');if(mt)mt.setAttribute('content',t[2])})()`
}
