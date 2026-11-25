import { Select } from 'antd'
import { THEME_OPTIONS } from '../themes'
import { useThemeSetting } from '../ThemeContext'

// Theme preference ('System' or a theme name) — reads/sets it via context, like useTheme()
export function ThemeToggle() {
  const { preference, setPreference } = useThemeSetting()
  return (
    <Select
      id="theme-select"
      aria-label="Theme"
      value={preference}
      onChange={setPreference}
      options={THEME_OPTIONS.map(n => ({ label: n, value: n }))}
      style={{ width: 160 }}
      size="small"
    />
  )
}
