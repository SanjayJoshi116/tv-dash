import { Spin } from 'antd'

interface Props {
  tip?: string
}

export function LoadingState({ tip = 'Loading...' }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: 64 }}>
      <Spin size="large" tip={tip} />
    </div>
  )
}
