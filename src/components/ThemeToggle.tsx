import { Button, ColorPicker, Grid, Popover, Segmented, Select } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'
import { CUSTOM_THEME, THEMES, THEME_OPTIONS, isCustomBase, type CustomThemeSettings } from '../themes'
import { useThemeSetting } from '../ThemeContext'
import { SPACING } from '../constants/ui'

// The built-in primaries as one-click presets (deduped: OLED Black shares Default Dark's)
const PRESETS = [{ label: 'Theme colors', colors: [...new Set(Object.values(THEMES).map(t => t.token.colorPrimary))] }]
const BASE_OPTIONS = [{ label: 'Dark', value: 'dark' }, { label: 'Light', value: 'light' }]

// Theme preference ('System', a theme name or 'Custom') — reads/sets it via context, like
// useTheme(). Custom shows an accent picker + Dark / Light base switch; every change goes through
// setCustom (applies live, saves debounced) — the same path for drags, hex input and presets.
export function ThemeToggle() {
  const { preference, setPreference, custom, setCustom } = useThemeSetting()
  // Below md the header has no room for picker + switch + select inline (~300px at 320px wide):
  // the Custom controls move into a "Customize" popover
  const compact = !Grid.useBreakpoint().md
  const withAccent = (hex: string): CustomThemeSettings => ({ ...custom, accent: hex.toLowerCase() })

  const customControls = (
    <>
      {/* Own trigger: a real, focusable button carrying the id / label (ColorPicker takes neither) */}
      <ColorPicker
        size="small"
        format="hex"
        disabledAlpha
        disabledFormat
        presets={PRESETS}
        value={custom.accent}
        onChange={c => setCustom(withAccent(c.toHexString()))}
      >
        <Button
          id="theme-accent"
          size="small"
          aria-label={`Accent color ${custom.accent}`}
          icon={<span style={{ display: 'block', width: 14, height: 14, borderRadius: 3, background: custom.accent }} />}
        />
      </ColorPicker>
      <Segmented
        id="theme-base"
        name="theme-base"
        aria-label="Custom theme base"
        size="small"
        options={BASE_OPTIONS}
        value={custom.base}
        onChange={v => { if (isCustomBase(v)) setCustom({ ...custom, base: v }) }}
      />
    </>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flexShrink: 0 }}>
      {preference === CUSTOM_THEME && (compact ? (
        <Popover
          trigger="click"
          placement="bottomRight"
          title="Custom theme"
          content={<div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>{customControls}</div>}
        >
          <Button id="theme-customize" size="small" aria-label="Customize theme" icon={<BgColorsOutlined />} />
        </Popover>
      ) : customControls)}
      <Select
        id="theme-select"
        aria-label="Theme"
        value={preference}
        onChange={setPreference}
        options={THEME_OPTIONS.map(n => ({ label: n, value: n }))}
        style={{ width: compact ? 136 : 160 }}
        size="small"
      />
    </div>
  )
}
