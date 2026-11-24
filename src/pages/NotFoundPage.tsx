import { useNavigate } from 'react-router-dom'
import { Button, Empty, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'

const { Text } = Typography

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Empty
        description={
          <>
            <Text strong>Page not found</Text>
            <br />
            <Text type="secondary">No page exists at this URL</Text>
          </>
        }
      />
      <Button icon={<ArrowLeftOutlined />} style={{ marginTop: 16 }} onClick={() => navigate('/')}>
        Back to Dashboard
      </Button>
    </div>
  )
}
