import { Select } from 'antd'
import { THEME_NAMES } from '../themes'

interface Props {
  value: string
  onChange: (name: string) => void
}

export function ThemeToggle({ value, onChange }: Props) {
  return (
    <Select
      value={value}
      onChange={onChange}
      options={THEME_NAMES.map(n => ({ label: n, value: n }))}
      style={{ width: 160 }}
      size="small"
    />
  )
}
