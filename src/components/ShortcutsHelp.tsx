import { Modal, Typography } from 'antd'
import { useTheme } from '../ThemeContext'
import { SHORTCUTS } from '../constants/shortcuts'
import { SPACING } from '../constants/ui'

const { Text } = Typography

interface Props {
  open: boolean
  onClose: () => void
}

// `?` cheat sheet. antd closes it on Escape and returns focus to where it was.
export function ShortcutsHelp({ open, onClose }: Props) {
  const theme = useTheme()
  const kbd = {
    display: 'inline-block',
    minWidth: 22,
    padding: `0 ${SPACING.xs + 2}px`,
    border: `1px solid ${theme.borderColor}`,
    borderBottomWidth: 2,
    borderRadius: 4,
    background: theme.headerBg,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: 12,
    lineHeight: '20px',
    textAlign: 'center' as const,
  }

  return (
    <Modal open={open} onCancel={onClose} footer={null} title="Keyboard shortcuts" width={400}>
      <dl style={{ margin: 0 }}>
        {SHORTCUTS.map(({ keys, label }) => (
          <div key={keys} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACING.sm}px 0`, borderBottom: `1px solid ${theme.borderColor}` }}>
            <dt><Text>{label}</Text></dt>
            <dd style={{ margin: 0, display: 'flex', gap: SPACING.xs, alignItems: 'center' }}>
              {keys.split(' ').map((k, i) => (
                <span key={i} style={{ display: 'contents' }}>
                  {i > 0 && <Text type="secondary" style={{ fontSize: 12 }}>then</Text>}
                  <kbd style={kbd}>{k}</kbd>
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <Text type="secondary" style={{ display: 'block', marginTop: SPACING.md, fontSize: 12 }}>
        Shortcuts are off while typing in a field and when Ctrl, ⌘ or Alt is held.
      </Text>
    </Modal>
  )
}
