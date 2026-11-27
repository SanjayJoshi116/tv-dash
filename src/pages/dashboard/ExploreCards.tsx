import type { NavigateFunction } from 'react-router-dom'
import { Button, Card, Col, Row, Typography } from 'antd'
import { BarChartOutlined, UnorderedListOutlined } from '@ant-design/icons'
import type { Theme } from '../../themes'
import { SECTION_GAP, cardStyle } from '../../constants/ui'

const { Text } = Typography

const EXPLORE_CARDS = [
  { title: 'Browse the full catalogue', subtitle: 'Search, filter, and sort every show', button: 'Go to Shows', icon: <UnorderedListOutlined />, to: '/shows', primary: true },
  { title: 'Dive into the analytics', subtitle: '14 charts on genres, ratings, watch time, and more', button: 'Go to Statistics', icon: <BarChartOutlined />, to: '/stats', primary: false },
]

interface Props {
  theme: Theme
  navigate: NavigateFunction
}

export function ExploreCards({ theme, navigate }: Props) {
  const baseCard = cardStyle(theme.isDark)
  return (
    <Row gutter={[16, 16]} style={{ marginTop: SECTION_GAP }}>
      {EXPLORE_CARDS.map(({ title, subtitle, button, icon, to, primary }) => (
        <Col key={to} xs={24} sm={12}>
          <Card size="small" style={{ ...baseCard, height: '100%' }} styles={{ body: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' } }}>
            <div>
              <Text strong style={{ fontSize: 14, display: 'block' }}>{title}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{subtitle}</Text>
            </div>
            <Button type={primary ? 'primary' : 'default'} icon={icon} onClick={() => navigate(to)}>{button}</Button>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
