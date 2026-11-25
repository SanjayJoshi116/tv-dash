import { theme as antTheme, type ThemeConfig } from 'antd'
import type { Theme } from './themes'
import { readableTextOn } from './utils/color'

// antd ConfigProvider theme for a dashboard Theme. Pure, so the theme contract test checks what
// antd actually renders.
// - algorithm from isDark (the dark algorithm shifts colorPrimary: Default Dark's #6366f1 renders
//   as #575ad0, so contrast must be judged on antd's derived token, not the seed)
// - colorTextLightSolid (primary-button text, antd's fixed #fff otherwise): white when it reaches
//   4.5:1 on the rendered primary, else black — white fails on Dracula / High Contrast / Nord /
//   Solarized Light and on pale Custom accents
// - motion off under reduced motion (Tabs ink bar, Select dropdown, Spin…)
export function antdThemeConfig(theme: Theme, reducedMotion: boolean): ThemeConfig {
  const algorithm = theme.isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm
  const token = { ...theme.token, motion: !reducedMotion }
  const renderedPrimary = antTheme.getDesignToken({ algorithm, token }).colorPrimary
  return { algorithm, token: { ...token, colorTextLightSolid: readableTextOn(renderedPrimary) } }
}
