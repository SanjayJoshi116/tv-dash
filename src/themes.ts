export type Theme = {
  name: string
  isDark: boolean
  token: { colorPrimary: string; colorBgBase: string; colorTextBase?: string }
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
    token: { colorPrimary: '#4f46e5', colorBgBase: '#ffffff', colorTextBase: '#000000' },
    headerBg: '#ffffff',
    contentBg: '#f5f5f7',
    borderColor: '#d9d9d9',
    posterFallbackBg: '#e8e8ed',
    chartColors: ['#4f46e5', '#7c3aed', '#db2777', '#d97706', '#059669', '#2563eb', '#dc2626', '#0d9488', '#ea580c', '#65a30d'],
    chartGrid: '#e0e0e0',
    chartText: '#1a1a1a',
    areaFill: '#4f46e5',
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
}

export const THEME_NAMES = Object.keys(THEMES)
export const DEFAULT_THEME_NAME = 'Default Dark'
