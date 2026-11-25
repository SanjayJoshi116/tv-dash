// @vitest-environment jsdom
// Runs the generated boot script (the exact string vite injects) against sample URLs / storage,
// so its inline resolution can't drift from readThemeOverride / parseCustomTheme / System.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BOOT_THEME_COLOR, themeBootScript } from './themeBootScript'
import { THEMES, type ThemeName } from './themes'
import { SETTINGS_KEY } from './utils/settings'
import { stubMatchMedia } from './hooks/matchMedia.fixture'

const CODE = themeBootScript()

function run(search: string, settings?: unknown, prefersDark = false) {
  window.history.replaceState(null, '', `/${search}`)
  if (settings !== undefined) localStorage.setItem(SETTINGS_KEY, typeof settings === 'string' ? settings : JSON.stringify(settings))
  stubMatchMedia(prefersDark)
  new Function(CODE)()
}

function expectPainted(name: ThemeName) {
  const probe = document.createElement('div').style
  probe.backgroundColor = THEMES[name].contentBg
  const root = document.documentElement.style
  expect(root.colorScheme).toBe(THEMES[name].isDark ? 'dark' : 'light')
  expect(root.backgroundColor).toBe(probe.backgroundColor)
  expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(THEMES[name].headerBg)
}

beforeEach(() => {
  const meta = document.createElement('meta')
  meta.name = 'theme-color'
  meta.content = BOOT_THEME_COLOR
  document.head.append(meta)
})

afterEach(() => {
  document.head.innerHTML = ''
  document.documentElement.removeAttribute('style')
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  vi.unstubAllGlobals()
})

describe('theme boot script', () => {
  it('no URL, nothing saved → System (OS light / dark)', () => {
    run('', undefined, false)
    expectPainted('Default Light')
    run('', undefined, true)
    expectPainted('Default Dark')
  })

  it('saved theme', () => {
    run('', { themeName: 'Nord' })
    expectPainted('Nord')
  })

  it.each([
    ['?theme=Dracula', 'Dracula'],
    ['?theme=default%20light', 'Default Light'],
    ['?theme=Default+Light', 'Default Light'],
    ['?foo=1&theme=%20solarized%20light%20', 'Solarized Light'],
    ['?theme=Dracula&theme=Nord', 'Dracula'],
  ] as const)('URL override %s → %s, over a saved Default Dark', (search, expected) => {
    run(search, { themeName: 'Default Dark' }, true)
    expectPainted(expected)
  })

  it.each(['?theme=Nope', '?theme=', '?theme=constructor'])('invalid override %s → saved theme', search => {
    run(search, { themeName: 'Dracula' })
    expectPainted('Dracula')
  })

  it('?theme=System overrides a saved theme with the OS scheme', () => {
    run('?theme=System', { themeName: 'Dracula' }, false)
    expectPainted('Default Light')
  })

  it('Custom (saved or via URL) paints its saved base; invalid base → dark', () => {
    run('', { themeName: 'Custom', customTheme: { accent: '#e11d48', base: 'light' } }, true)
    expectPainted('Default Light')
    run('?theme=custom', { themeName: 'Dracula', customTheme: { base: 'light' } }, true)
    expectPainted('Default Light')
    run('', { themeName: 'Custom', customTheme: { base: 'nope' } }, false)
    expectPainted('Default Dark')
  })

  it('?reset ignores the saved theme but still honors an override', () => {
    run('?reset', { themeName: 'Dracula' }, false)
    expectPainted('Default Light')
    run('?reset&theme=Nord', { themeName: 'Dracula' }, false)
    expectPainted('Nord')
  })

  it('corrupt storage still allows an override', () => {
    run('?theme=Nord', '{not json')
    expectPainted('Nord')
    run('', '{not json', true)
    expectPainted('Default Dark')
  })

  it('never writes storage', () => {
    run('?theme=Dracula', { themeName: 'Default Light' })
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)!)).toEqual({ themeName: 'Default Light' })
  })
})
