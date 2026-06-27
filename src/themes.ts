export type Theme = {
  name: string
  isDark: boolean
  token: { colorPrimary: string; colorBgBase: string }
  headerBg: string
  contentBg: string
  borderColor: string
  posterFallbackBg: string
  chartColors: string[]
  chartGrid: string
  chartText: string
  areaFill: string
}

export const THEMES: Record<string, Theme> = {
  'Default Dark': {
    name: 'Default Dark',
    isDark: true,
    token: { colorPrimary: '#6366f1', colorBgBase: '#0a0a0a' },
    headerBg: '#141414',
    contentBg: '#0a0a0a',
    borderColor: '#2a2a2a',
    posterFallbackBg: '#1a1a2e',
    chartColors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#84cc16'],
    chartGrid: '#333',
    chartText: '#ccc',
    areaFill: '#6366f1',
  },
  'Default Light': {
    name: 'Default Light',
    isDark: false,
    token: { colorPrimary: '#6366f1', colorBgBase: '#ffffff' },
    headerBg: '#ffffff',
    contentBg: '#f0f2f5',
    borderColor: '#e8e8e8',
    posterFallbackBg: '#f0f0f0',
    chartColors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#84cc16'],
    chartGrid: '#eee',
    chartText: '#333',
    areaFill: '#818cf8',
  },
  'AMOLED': {
    name: 'AMOLED',
    isDark: true,
    token: { colorPrimary: '#bb86fc', colorBgBase: '#000000' },
    headerBg: '#000000',
    contentBg: '#000000',
    borderColor: '#1a1a1a',
    posterFallbackBg: '#0d0d0d',
    chartColors: ['#bb86fc', '#cf6679', '#03dac6', '#ffb74d', '#81c784', '#64b5f6', '#ff8a65', '#4dd0e1', '#f06292', '#aed581'],
    chartGrid: '#1a1a1a',
    chartText: '#aaa',
    areaFill: '#bb86fc',
  },
  'Dracula': {
    name: 'Dracula',
    isDark: true,
    token: { colorPrimary: '#bd93f9', colorBgBase: '#282a36' },
    headerBg: '#21222c',
    contentBg: '#282a36',
    borderColor: '#44475a',
    posterFallbackBg: '#1e1f29',
    chartColors: ['#bd93f9', '#ff79c6', '#50fa7b', '#f1fa8c', '#8be9fd', '#ffb86c', '#ff5555', '#6272a4', '#94e6ff', '#45b3e0'],
    chartGrid: '#44475a',
    chartText: '#f8f8f2',
    areaFill: '#bd93f9',
  },
  'Catppuccin': {
    name: 'Catppuccin',
    isDark: true,
    token: { colorPrimary: '#cba6f7', colorBgBase: '#1e1e2e' },
    headerBg: '#181825',
    contentBg: '#1e1e2e',
    borderColor: '#313244',
    posterFallbackBg: '#1e1e2e',
    chartColors: ['#cba6f7', '#f38ba8', '#a6e3a1', '#f9e2af', '#89dceb', '#fab387', '#89b4fa', '#b4befe', '#eba0ac', '#94e2d5'],
    chartGrid: '#313244',
    chartText: '#cdd6f4',
    areaFill: '#cba6f7',
  },
}

export const THEME_NAMES = Object.keys(THEMES)
export const DEFAULT_THEME_NAME = 'Default Dark'
